import email
import email.policy
import importlib.util
import json
import os
import pathlib
import unittest
from unittest.mock import patch

path=pathlib.Path(__file__).resolve().parents[1]/'api'/'acos-mail.py'
spec=importlib.util.spec_from_file_location('acos_mail',path)
mail=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mail)

BOX={'id':'ventas','address':'ventas@acos.example','department':'ventas','label':'Ventas','password':'TEST_SECRET','uids':['agent-a'],'monitoringApproved':True}
AGENT={'uid':'agent-a','admin':False,'token':'TEST'}
OTHER={'uid':'agent-b','admin':False,'token':'TEST'}
OWNER={'uid':'owner','admin':True,'token':'TEST'}

class MailTests(unittest.TestCase):
    def test_disabled_does_not_contact_provider(self):
        with patch.dict(os.environ,{'ACOS_MAIL_ENABLED':'false'},clear=True),patch.object(mail,'connect') as conn:
            self.assertFalse(mail.dispatch(AGENT,{'action':'status'})['enabled'])
            with self.assertRaises(mail.MailError):mail.dispatch(AGENT,{'action':'list','mailbox':'ventas'})
            conn.assert_not_called()

    def test_mailbox_scope_and_supervision_read_only(self):
        self.assertEqual(mail.authorize_box(AGENT,[BOX],'ventas','send',False),BOX)
        for session,action,oversight in [(OTHER,'list',False),(OWNER,'send',False),(OTHER,'read',True),(OWNER,'send',True),(OWNER,'draft',True),(OWNER,'markRead',True)]:
            with self.assertRaises(mail.MailError):mail.authorize_box(session,[BOX],'ventas',action,oversight)
        self.assertEqual(mail.authorize_box(OWNER,[BOX],'ventas','read',True),BOX)
        with self.assertRaises(mail.MailError):mail.authorize_box(OWNER,[{**BOX,'monitoringApproved':False}],'ventas','read',True)
        self.assertNotIn('password',mail.safe_box(BOX,AGENT))
        self.assertNotIn('uids',mail.safe_box(BOX,AGENT))
        self.assertNotIn('password',mail.safe_box(BOX,OWNER))

    def test_oversight_fails_closed_before_imap(self):
        with patch.object(mail,'configuration',return_value=(True,'acos.example',[BOX])),patch.object(mail,'audit',side_effect=mail.MailError(503,'audit failed')) as audit,patch.object(mail,'connect') as conn:
            with self.assertRaises(mail.MailError):mail.dispatch(OWNER,{'action':'read','mailbox':'ventas','oversight':True,'uid':'123','reason':'Valid purpose'})
            audit.assert_called_once();conn.assert_not_called()

    def test_registry_rejects_personal_mail_and_duplicate_addresses(self):
        base={'ACOS_MAIL_ENABLED':'true','ACOS_MAIL_DOMAIN':'acos.example','ACOS_MAILBOXES_JSON':json.dumps([BOX])}
        with patch.dict(os.environ,base,clear=True):self.assertEqual(mail.configuration()[2][0]['id'],'ventas')
        with patch.dict(os.environ,{**base,'ACOS_MAILBOXES_JSON':json.dumps([{**BOX,'address':'personal@gmail.com'}])},clear=True):
            with self.assertRaises(mail.MailError):mail.configuration()
        with patch.dict(os.environ,{**base,'ACOS_MAILBOXES_JSON':json.dumps([BOX,{**BOX,'id':'dup'}])},clear=True):
            with self.assertRaises(mail.MailError):mail.configuration()

    def test_from_fixed_and_no_header_injection(self):
        data={'to':'contact@example.com','cc':'','subject':'Prueba','body':'Hola','from':'fake@example.com','attachments':[]}
        msg,to=mail.build_message(BOX,data)
        self.assertEqual(str(msg['From']),BOX['address']);self.assertEqual(to,['contact@example.com'])
        with self.assertRaises(mail.MailError):mail.build_message(BOX,{**data,'subject':'x\r\nBcc: secret@example.com'})
        with self.assertRaises(mail.MailError):mail.build_message(BOX,{**data,'to':'x@example.com\r\nBcc:y@example.com'})
        draft,to=mail.build_message(BOX,{},draft=True)
        self.assertEqual(to,[]);self.assertIsNone(draft.get('To'))

    def test_message_body_strips_active_html_and_remote_images(self):
        msg=email.message.EmailMessage(policy=email.policy.default)
        msg.set_content('<html><body>Hola<img src="https://tracker.example/x"><script>bad()</script><style>secret</style><p>Texto</p></body></html>',subtype='html')
        detail=mail.message_detail(msg)
        self.assertIn('Hola',detail['body']);self.assertIn('Texto',detail['body'])
        self.assertNotIn('tracker',detail['body']);self.assertNotIn('bad()',detail['body']);self.assertNotIn('secret',detail['body'])
        
    def test_uidvalidity_and_folders(self):
        with self.assertRaises(mail.MailError):mail.require_validity({'validity':'1'},'2')
        with self.assertRaises(mail.MailError):mail.folder_name(BOX,'../../abc')
        with self.assertRaises(mail.MailError):mail.message_uid({'uid':'1:99'})
        self.assertEqual(mail.folder_name(BOX,'inbox'),'INBOX')

    def test_missing_or_unverified_token_rejected(self):
        with self.assertRaises(mail.MailError):mail.auth_session('bad')

if __name__=='__main__':unittest.main()
