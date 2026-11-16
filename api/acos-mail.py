"""ACOS Mail: authenticated corporate-only IMAP/SMTP gateway.

No client-provided host, login, secret or From address. No HTML execution, no
remote images, no personal Gmail connection. Read-only oversight is audited
before any access to another corporate mailbox.
"""
import base64
import datetime
import email
import email.policy
import email.utils
import html.parser
import imaplib
import json
import os
import re
import smtplib
import ssl
import time
import uuid
from http.server import BaseHTTPRequestHandler
from urllib.parse import quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError

HOST = 'mail.privateemail.com'
PROJECT = 'seguros-d1a86'
PUBLIC_API_KEY = 'AIzaSyBVj_hH6ULUggOG_wZ05_ahcrLomME4v-U'
OWNERS = {'norvingarcia220@gmail.com', 'amyblandon171@gmail.com'}
DEPTS = {'direccion','ventas','operaciones','servicio','finanzas','supervision'}
FOLDERS = {'inbox':'INBOX','sent':'Sent','drafts':'Drafts','archive':'Archive','trash':'Trash','spam':'Junk'}
MAX_MESSAGE = 3 * 1024 * 1024
MAX_ATTACHMENT = 2 * 1024 * 1024
MAX_REQUEST = 3 * 1024 * 1024 + 65536
ADDR = re.compile(r'^[A-Za-z0-9.!#$%&*+/=?^_\x60{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$')
ID = re.compile(r'^[A-Za-z0-9_-]{1,128}$')
MESSAGE_ID = re.compile(r'^<[^<>\s\r\n]{1,250}>$')
TLS = ssl.create_default_context()

class MailError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message

def fail(status, message):
    raise MailError(status, message)

def http_json(url, token=None, data=None, timeout=8):
    headers = {'Accept':'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if data is not None: headers['Content-Type'] = 'application/json'
    request = Request(url, None if data is None else json.dumps(data).encode(), headers)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read(2_000_000))

def text_field(value, limit, field, required=False):
    if not isinstance(value,str) or len(value)>limit or (required and not value.strip()):
        fail(400,'Revisa '+field+'.')
    return value.strip()

def fs_value(v):
    if not isinstance(v,dict): return None
    if 'stringValue' in v: return v['stringValue']
    if 'booleanValue' in v: return v['booleanValue']
    if 'timestampValue' in v: return v['timestampValue']
    if 'arrayValue' in v: return [fs_value(x) for x in v['arrayValue'].get('values',[])]
    return None

def fs_fields(doc):
    return {k:fs_value(v) for k,v in doc.get('fields',{}).items()}

def documents_url():
    project=os.environ.get('ACOS_MAIL_FIREBASE_PROJECT',PROJECT)
    if not re.fullmatch(r'[a-z0-9-]{4,40}',project): fail(503,'Configuración Firebase inválida.')
    return 'https://firestore.googleapis.com/v1/projects/'+project+'/databases/(default)/documents'

def auth_session(token):
    if not isinstance(token,str) or len(token)>8192 or token.count('.')!=2:
        fail(401,'Inicia sesión nuevamente.')
    key=os.environ.get('ACOS_MAIL_FIREBASE_API_KEY',PUBLIC_API_KEY)
    try:
        # Firebase validates the ID token. Decoding is NOT a substitute for that check.
        account=http_json('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+quote(key),data={'idToken':token})['users'][0]
        payload=token.split('.')[1]
        claims=json.loads(base64.urlsafe_b64decode(payload+'='*(-len(payload)%4)))
    except (HTTPError,KeyError,IndexError,ValueError,TypeError):
        fail(401,'Sesión inválida o vencida.')
    uid=account.get('localId','')
    project=os.environ.get('ACOS_MAIL_FIREBASE_PROJECT',PROJECT)
    address=account.get('email','').lower()
    if not ID.fullmatch(uid) or account.get('disabled') or account.get('emailVerified') is not True or claims.get('email_verified') is not True or claims.get('sub')!=uid or claims.get('aud')!=project or claims.get('iss')!='https://securetoken.google.com/'+project or claims.get('exp',0)<=time.time() or str(claims.get('email','')).lower()!=address:
        fail(403,'Sesión empresarial no autorizada.')
    if account.get('validSince') and claims.get('auth_time',0)<int(account['validSince']):
        fail(401,'Sesión revocada. Inicia sesión de nuevo.')
    admin=address in OWNERS
    if not admin:
        try:
            member=fs_fields(http_json(documents_url()+'/companies/main/members/'+quote(uid),token))
        except HTTPError:
            fail(403,'No tienes acceso a ACOS Mail.')
        if member.get('active') is not True or member.get('role') not in DEPTS:
            fail(403,'ACOS Mail es exclusivo del personal activo.')
    return {'uid':uid,'admin':admin,'token':token}

def configuration():
    if os.environ.get('ACOS_MAIL_ENABLED','').lower()!='true':
        return False,'',[]
    domain=os.environ.get('ACOS_MAIL_DOMAIN','').strip().lower()
    if not re.fullmatch(r'[a-z0-9][a-z0-9.-]{2,120}\.[a-z]{2,63}',domain) or domain in {'gmail.com','outlook.com','hotmail.com','yahoo.com','icloud.com','live.com','proton.me'}:
        fail(503,'Configura el dominio empresarial verificado.')
    try: registry=json.loads(os.environ.get('ACOS_MAILBOXES_JSON','[]'))
    except ValueError: fail(503,'Configuración de buzones inválida.')
    if not isinstance(registry,list) or len(registry)>100: fail(503,'Configuración de buzones inválida.')
    seen=set()
    addresses=set()
    for box in registry:
        if not isinstance(box,dict): fail(503,'Registro de buzón inválido.')
        boxid=box.get('id','')
        address=box.get('address','')
        uids=box.get('uids',[])
        if not isinstance(boxid,str) or not ID.fullmatch(boxid) or boxid in seen or not isinstance(address,str) or not ADDR.fullmatch(address) or address.lower().split('@')[-1]!=domain or address.lower() in addresses or box.get('department') not in DEPTS or not isinstance(box.get('password'),str) or not box['password'] or not isinstance(uids,list) or not uids or any(not isinstance(u,str) or not ID.fullmatch(u) for u in uids):
            fail(503,'Registro de buzón inválido.')
        if not isinstance(box.get('label',address),str): fail(503,'Etiqueta de buzón inválida.')
        seen.add(boxid);addresses.add(address.lower())
    return True,domain,registry

def safe_box(box,session):
    item={'id':box['id'],'address':box['address'],'label':box.get('label',box['address']),'department':box['department'],'own':session['uid'] in box['uids'],'supervised':box.get('monitoringApproved') is True}
    if session['admin']: item['uids']=box['uids']
    return item

def authorize_box(session, registry, box_id, action, oversight):
    box=next((b for b in registry if b['id']==box_id),None)
    if box is None: fail(404,'Buzón no asignado.')
    if oversight:
        if not session['admin'] or box.get('monitoringApproved') is not True:
            fail(403,'Supervisión no autorizada para este buzón.')
        if action not in {'list','read','attachment'}: fail(403,'La supervisión es de solo lectura.')
    elif session['uid'] not in box['uids']:
        fail(403,'No tienes permiso para este buzón.')
    return box

def audit(session, box, action, folder, uid, reason):
    reason=text_field(reason,250,'el motivo de supervisión',True)
    if len(reason)<8: fail(400,'Indica un motivo de supervisión de al menos 8 caracteres.')
    project=os.environ.get('ACOS_MAIL_FIREBASE_PROJECT',PROJECT)
    path='projects/'+project+'/databases/(default)/documents/companies/main/mailAudit/'+uuid.uuid4().hex
    fields={k:{'stringValue':v} for k,v in {'actorUid':session['uid'],'mailboxId':box['id'],'department':box['department'],'action':action,'folder':folder,'messageUid':str(uid or ''),'reason':reason}.items()}
    data={'writes':[{'update':{'name':path,'fields':fields},'currentDocument':{'exists':False},'updateTransforms':[{'fieldPath':'createdAt','setToServerValue':'REQUEST_TIME'}]}]}
    try: http_json(documents_url()+':commit',session['token'],data)
    except (HTTPError,OSError,ValueError): fail(503,'Supervisión bloqueada: no se pudo registrar la consulta. Publica las reglas de auditoría.')

def audit_history(session):
    if not session['admin']: fail(403,'Consulta exclusiva de Dirección.')
    try:
        result=http_json(documents_url()+'/companies/main/mailAudit?pageSize=50&orderBy=createdAt%20desc',session['token'])
    except HTTPError: fail(503,'Publica las reglas de auditoría de ACOS Mail.')
    return {'entries':[fs_fields(x) for x in result.get('documents',[])]}

def folder_name(box, key):
    if key not in FOLDERS: fail(400,'Carpeta inválida.')
    value=box.get('folders',{}).get(key,FOLDERS[key])
    if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9 ._/-]{1,100}',value): fail(503,'Nombre de carpeta inválido.')
    return value

def quoted_folder(box,key):
    return '"'+folder_name(box,key)+'"'

def connect(box):
    client=imaplib.IMAP4_SSL(HOST,993,ssl_context=TLS,timeout=10)
    try: client.login(box['address'],box['password'])
    except Exception:
        try: client.logout()
        except Exception: pass
        raise
    return client

def select(client,box,folder,readonly=True):
    status,_=client.select(quoted_folder(box,folder),readonly=readonly)
    if status!='OK': fail(404,'Esta carpeta no está disponible. Revisa los nombres IMAP.')
    result=client.response('UIDVALIDITY')[1]
    validity=str(result[0].decode()) if result and result[0] else ''
    if not validity.isdigit(): fail(502,'No se pudo identificar la versión de la carpeta.')
    return validity

def message_uid(data):
    value=data.get('uid')
    if not isinstance(value,str) or not re.fullmatch(r'[1-9][0-9]{0,9}',value): fail(400,'Mensaje inválido.')
    return value

def require_validity(data,validity):
    if data.get('validity')!=validity: fail(409,'La carpeta cambió. Actualiza la bandeja.')

def header_fields(msg):
    return {'from':str(msg.get('From',''))[:500],'to':str(msg.get('To',''))[:1000],'cc':str(msg.get('Cc',''))[:1000],'subject':str(msg.get('Subject','(Sin asunto)'))[:500],'date':str(msg.get('Date',''))[:120],'messageId':str(msg.get('Message-ID',''))[:250]}

def list_mail(client,box,folder,data):
    validity=select(client,box,folder)
    status,values=client.uid('SEARCH',None,'ALL')
    if status!='OK': fail(502,'No se pudo consultar la carpeta.')
    ids=(values[0] or b'').split()
    before=data.get('before','')
    if before:
        if not isinstance(before,str) or not before.isdigit(): fail(400,'Página inválida.')
        ids=[x for x in ids if int(x)<int(before)]
    page=ids[-30:]
    if not page: return {'messages':[],'validity':validity,'next':''}
    status,items=client.uid('FETCH',b','.join(page).decode(),'(UID FLAGS RFC822.SIZE BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID)])')
    if status!='OK': fail(502,'No se pudieron cargar los encabezados.')
    messages=[]
    for item in items:
        if not isinstance(item,tuple) or len(item)<2: continue
        meta,raw=item[:2]
        uid=re.search(rb'\bUID (\d+)',meta)
        size=re.search(rb'\bRFC822.SIZE (\d+)',meta)
        if uid:
            row=header_fields(email.message_from_bytes(raw,policy=email.policy.default))
            row.update({'uid':uid.group(1).decode(),'size':int(size.group(1)) if size else 0,'unread':b'\\Seen' not in meta})
            messages.append(row)
    messages.sort(key=lambda x:int(x['uid']),reverse=True)
    return {'messages':messages,'validity':validity,'next':page[0].decode() if len(ids)>len(page) else ''}

class PlainHTML(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.parts=[];self.hidden=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style','head','noscript'): self.hidden+=1
        elif not self.hidden and tag in ('p','div','br','li','tr','h1','h2','h3'): self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style','head','noscript'): self.hidden=max(0,self.hidden-1)
    def handle_data(self,data):
        if not self.hidden: self.parts.append(data)

def read_message(client,box,folder,data):
    uid=message_uid(data)
    validity=select(client,box,folder)
    require_validity(data,validity)
    status,meta=client.uid('FETCH',uid,'(UID RFC822.SIZE)')
    if status!='OK': fail(404,'Mensaje no disponible.')
    size=re.search(rb'RFC822.SIZE (\d+)',b' '.join(x for x in meta if isinstance(x,bytes)))
    if not size or int(size.group(1))>MAX_MESSAGE: fail(413,'Este mensaje excede 3 MB. Consúltalo desde el webmail empresarial.')
    status,items=client.uid('FETCH',uid,'(BODY.PEEK[])')
    if status!='OK': fail(502,'No se pudo leer el mensaje.')
    raw=next((x[1] for x in items if isinstance(x,tuple)),None)
    if not raw: fail(404,'Mensaje no disponible.')
    if len(raw)>MAX_MESSAGE: fail(413,'Mensaje demasiado grande.')
    return email.message_from_bytes(raw,policy=email.policy.default)

def filename(part):
    return re.sub(r'[\x00-\x1f\x7f/\\]','_',str(part.get_filename() or 'archivo'))[:150] or 'archivo'

def attachments(msg):
    return [p for p in msg.walk() if not p.is_multipart() and (p.get_filename() or p.get_content_disposition()=='attachment')]

def message_detail(msg):
    row=header_fields(msg)
    body=msg.get_body(preferencelist=('plain','html'))
    content=''
    if body is not None:
        try: content=str(body.get_content())
        except (LookupError,UnicodeError,ValueError): content='No se pudo decodificar el texto.'
        if body.get_content_type()=='text/html':
            parser=PlainHTML();parser.feed(content);content=''.join(parser.parts)
    row['body']=content[:150000]
    row['attachments']=[{'index':i,'name':filename(p),'size':len(p.get_payload(decode=True) or b'')} for i,p in enumerate(attachments(msg))]
    return row

def address_list(value):
    if not isinstance(value,str) or len(value)>1500 or '\r' in value or '\n' in value: fail(400,'Destinatarios inválidos.')
    addresses=[a.strip() for a in re.split(r'[,;]',value) if a.strip()]
    if any(not ADDR.fullmatch(a) for a in addresses): fail(400,'Introduce direcciones de correo separadas por comas.')
    return list(dict.fromkeys(addresses))

def build_message(box,data,draft=False):
    to=address_list(data.get('to',''));cc=address_list(data.get('cc',''))
    if (not draft and not to) or len(to)+len(cc)>15: fail(400,'Indica entre 1 y 15 destinatarios.')
    subject=text_field(data.get('subject',''),300,'el asunto',not draft)
    if '\r' in subject or '\n' in subject: fail(400,'Asunto inválido.')
    body=text_field(data.get('body',''),150000,'el mensaje',not draft)
    msg=email.message.EmailMessage(policy=email.policy.SMTP)
    msg['From']=box['address'];msg['Subject']=subject
    if to: msg['To']=', '.join(to)
    if cc: msg['Cc']=', '.join(cc)
    msg['Date']=email.utils.formatdate(localtime=False)
    msg['Message-ID']=email.utils.make_msgid(domain=box['address'].split('@')[-1])
    reply=data.get('replyTo','')
    if isinstance(reply,str) and MESSAGE_ID.fullmatch(reply):
        msg['In-Reply-To']=reply;msg['References']=reply
    msg.set_content(body)
    files=data.get('attachments',[])
    if not isinstance(files,list) or len(files)>5: fail(400,'Máximo cinco archivos.')
    total=0
    for item in files:
        if not isinstance(item,dict): fail(400,'Adjunto inválido.')
        name=text_field(item.get('name'),150,'el nombre del archivo',True)
        if re.search(r'[\x00-\x1f\x7f/\\]',name): fail(400,'Nombre de archivo inválido.')
        try: payload=base64.b64decode(item.get('data',''),validate=True)
        except (TypeError,ValueError): fail(400,'Adjunto inválido.')
        total+=len(payload)
        if total>MAX_ATTACHMENT: fail(413,'Los adjuntos deben sumar máximo 2 MB.')
        # Send opaque files; do not execute or trust client MIME types.
        msg.add_attachment(payload,maintype='application',subtype='octet-stream',filename=name)
    return msg,to+cc

def send_mail(box,data):
    msg,recipients=build_message(box,data)
    # Do not automatically retry SMTP: a lost acknowledgement can mean accepted mail.
    with smtplib.SMTP_SSL(HOST,465,timeout=12,context=TLS) as smtp:
        smtp.login(box['address'],box['password'])
        refused=smtp.send_message(msg,from_addr=box['address'],to_addrs=recipients)
    sent_copy=False
    try:
        with connect(box) as client:
            status,_=client.append(quoted_folder(box,'sent'),r'\Seen',None,msg.as_bytes())
            sent_copy=status=='OK'
    except Exception: pass
    return {'sent':True,'sentCopy':sent_copy,'refused':list(refused.keys())}

def dispatch(session,data):
    if not isinstance(data,dict): fail(400,'Solicitud inválida.')
    action=data.get('action')
    enabled,domain,registry=configuration()
    if action=='status':
        return {'enabled':enabled,'domain':domain,'admin':session['admin'],'mailboxes':[safe_box(b,session) for b in registry if session['admin'] or session['uid'] in b['uids']]}
    if action=='audit': return audit_history(session)
    if not enabled: fail(503,'ACOS Mail aún no está conectado.')
    if action not in {'list','read','attachment','send','draft','markRead'}: fail(400,'Operación inválida.')
    oversight=data.get('oversight') is True
    box=authorize_box(session,registry,data.get('mailbox'),action,oversight)
    folder=data.get('folder','inbox')
    if not isinstance(folder,str) or folder not in FOLDERS: fail(400,'Carpeta inválida.')
    if oversight: audit(session,box,action,folder,data.get('uid'),data.get('reason'))
    if action=='send': return send_mail(box,data)
    with connect(box) as client:
        if action=='list': return list_mail(client,box,folder,data)
        if action=='draft':
            msg,_=build_message(box,data,draft=True)
            status,_=client.append(quoted_folder(box,'drafts'),r'\Draft',None,msg.as_bytes())
            if status!='OK': fail(502,'No se pudo guardar el borrador.')
            return {'saved':True}
        if action=='markRead':
            uid=message_uid(data);require_validity(data,select(client,box,folder,False))
            status,_=client.uid('STORE',uid,'+FLAGS.SILENT',r'(\Seen)')
            if status!='OK': fail(502,'No se pudo marcar como leído.')
            return {'saved':True}
        msg=read_message(client,box,folder,data)
        if action=='read': return message_detail(msg)
        index=data.get('index');parts=attachments(msg)
        if type(index) is not int or not 0<=index<len(parts): fail(404,'Adjunto no disponible.')
        part=parts[index];payload=part.get_payload(decode=True) or b''
        if len(payload)>MAX_ATTACHMENT: fail(413,'Adjunto superior a 2 MB. Usa el webmail empresarial.')
        return {'name':filename(part),'data':base64.b64encode(payload).decode()}

class handler(BaseHTTPRequestHandler):
    def log_message(self,*args): pass
    def respond(self,status,payload):
        raw=json.dumps(payload,ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Cache-Control','private, no-store, max-age=0')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy',"default-src 'none'")
        self.send_header('Content-Length',str(len(raw)))
        self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        self.respond(405,{'error':'Método no permitido.'})
    def do_POST(self):
        try:
            authorization=self.headers.get('Authorization','')
            if not authorization.startswith('Bearer '): fail(401,'Inicia sesión.')
            if not self.headers.get('Content-Type','').lower().startswith('application/json'): fail(415,'Formato inválido.')
            try: length=int(self.headers.get('Content-Length','0'))
            except ValueError: fail(400,'Tamaño inválido.')
            if not 0<length<=MAX_REQUEST: fail(413,'Solicitud demasiado grande.')
            try: data=json.loads(self.rfile.read(length))
            except (ValueError,UnicodeError): fail(400,'Solicitud inválida.')
            session=auth_session(authorization[7:])
            self.respond(200,dispatch(session,data))
        except MailError as e: self.respond(e.status,{'error':e.message})
        except smtplib.SMTPAuthenticationError: self.respond(502,{'error':'Namecheap rechazó la autenticación SMTP. Revisa la contraseña de aplicación.'})
        except imaplib.IMAP4.error: self.respond(502,{'error':'Namecheap rechazó la operación IMAP. Revisa la cuenta y la carpeta.'})
        except (TimeoutError,OSError,smtplib.SMTPException): self.respond(502,{'error':'No se completó la comunicación con el servicio. Si estabas enviando un correo, revisa Enviados antes de reintentar.'})
        except Exception: self.respond(500,{'error':'No se pudo completar la operación. Contacta a Sistemas.'})
