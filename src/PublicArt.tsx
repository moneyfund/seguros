/** Lightweight vector architecture. No canvas, WebGL, stock imagery or customer data. */
export function ProtectionArchitecture() {
  return <svg className="ap-architecture" viewBox="0 0 1100 480" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ap-stone" x1="330" y1="100" x2="650" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#F8FAF7"/><stop offset=".4" stopColor="#D8DFD9"/><stop offset="1" stopColor="#98AA9F"/></linearGradient>
      <linearGradient id="ap-edge" x1="300" y1="100" x2="620" y2="320" gradientUnits="userSpaceOnUse"><stop stopColor="#6F897A"/><stop offset="1" stopColor="#274E3D"/></linearGradient>
      <linearGradient id="ap-inner" x1="360" y1="90" x2="650" y2="370" gradientUnits="userSpaceOnUse"><stop stopColor="#426D55"/><stop offset=".65" stopColor="#173F30"/><stop offset="1" stopColor="#092A20"/></linearGradient>
      <linearGradient id="ap-orb" x1="520" y1="287" x2="575" y2="355" gradientUnits="userSpaceOnUse"><stop stopColor="#FFFFFF"/><stop offset=".35" stopColor="#EDF1EB"/><stop offset=".8" stopColor="#BBC9BC"/><stop offset="1" stopColor="#7F9986"/></linearGradient>
      <radialGradient id="ap-shadow"><stop stopColor="#203C2F" stopOpacity=".24"/><stop offset="1" stopColor="#203C2F" stopOpacity="0"/></radialGradient>
      <linearGradient id="ap-plinth" x1="440" y1="348" x2="610" y2="390" gradientUnits="userSpaceOnUse"><stop stopColor="#CED8CC"/><stop offset="1" stopColor="#8CA18D"/></linearGradient>
    </defs>
    <path d="M40 417H1060M550 415L365 465M550 415L735 465M550 415V477" stroke="#C3CEC3" strokeWidth=".7"/>
    <ellipse cx="567" cy="413" rx="370" ry="57" fill="url(#ap-shadow)"/>
    <g className="ap-arch-rear" transform="translate(153 62) scale(.76)">
      <path d="M283 412V220C283 102 372 24 486 24H560C674 24 762 102 762 220V412L733 430H681V226C681 147 627 97 552 97H494C419 97 365 147 365 226V430H312Z" fill="url(#ap-edge)"/>
      <path fillRule="evenodd" d="M254 430V238C254 120 343 42 457 42H531C645 42 733 120 733 238V430H652V244C652 165 598 115 523 115H465C390 115 336 165 336 244V430H254Z" fill="url(#ap-stone)"/>
    </g>
    <g className="ap-arch-middle" transform="translate(51 27) scale(.9)">
      <path d="M283 412V220C283 102 372 24 486 24H560C674 24 762 102 762 220V412L733 430H681V226C681 147 627 97 552 97H494C419 97 365 147 365 226V430H312Z" fill="url(#ap-edge)"/>
      <path fillRule="evenodd" d="M254 430V238C254 120 343 42 457 42H531C645 42 733 120 733 238V430H652V244C652 165 598 115 523 115H465C390 115 336 165 336 244V430H254Z" fill="url(#ap-stone)"/>
      <path d="M254 430V238C254 120 343 42 457 42H531C645 42 733 120 733 238V430" stroke="#F4F7F0" strokeWidth="1.2"/>
    </g>
    <g className="ap-arch-front" transform="translate(-40 -15)">
      <path d="M283 412V220C283 102 372 24 486 24H560C674 24 762 102 762 220V412L733 430H681V226C681 147 627 97 552 97H494C419 97 365 147 365 226V430H312Z" fill="#133B2D"/>
      <path fillRule="evenodd" d="M254 430V238C254 120 343 42 457 42H531C645 42 733 120 733 238V430H652V244C652 165 598 115 523 115H465C390 115 336 165 336 244V430H254Z" fill="url(#ap-inner)"/>
      <path d="M254 430V238C254 120 343 42 457 42H531C645 42 733 120 733 238V430" stroke="#64876B" strokeWidth="1.2"/>
      <path d="M336 430V244C336 165 390 115 465 115H523C598 115 652 165 652 244V430" stroke="#74917A" strokeOpacity=".5"/>
    </g>
    <ellipse cx="548" cy="389" rx="116" ry="22" fill="url(#ap-shadow)"/>
    <path d="M456 364V380C456 403 638 403 638 380V364" fill="url(#ap-plinth)"/>
    <ellipse cx="547" cy="364" rx="91" ry="18" fill="#E1E7DA"/>
    <ellipse cx="548" cy="359" rx="43" ry="9" fill="#9CAE96" opacity=".55"/>
    <circle cx="548" cy="324" r="39" fill="url(#ap-orb)"/>
    <g stroke="#A0B29F" strokeWidth=".8"><path d="M88 248H179L214 282M783 177L826 131H1008"/><circle cx="214" cy="282" r="3" fill="#FAFBF7"/><circle cx="783" cy="177" r="3" fill="#FAFBF7"/></g>
    <path d="M546 437h8m-4-4v8" stroke="#647F69"/>
  </svg>;
}

export function SolutionDrawing({kind}:{kind:string}) {
  return <svg viewBox="0 0 400 260" fill="none" aria-hidden="true" className={'ap-solution-drawing ap-drawing-'+kind}>
    <g stroke="currentColor" strokeWidth="1.2">
      <ellipse cx="205" cy="222" rx="155" ry="25" opacity=".18"/>
      <path d="M205 21V245M37 222H373" opacity=".16" strokeDasharray="3 6"/>
      {kind==='vida'&&<><circle cx="158" cy="121" r="71"/><circle cx="250" cy="121" r="71"/><path d="M204 68C164 98 164 144 204 174C244 144 244 98 204 68Z" fill="currentColor" opacity=".13"/><circle cx="204" cy="121" r="9" fill="currentColor"/><path d="M83 194H325" opacity=".4"/></>}
      {kind==='vehiculos'&&<><path d="M74 169L88 119L126 108L157 74H260L296 114L332 127V172H308M106 172H273M98 114H291M143 108L168 83H250L274 108H143Z"/><circle cx="124" cy="170" r="22"/><circle cx="290" cy="170" r="22"/><path d="M43 141H70M29 152H64M74 201H337" opacity=".45"/></>}
      {kind==='salud'&&<><circle cx="205" cy="130" r="91"/><circle cx="205" cy="130" r="73" opacity=".35"/><path d="M185 78H225V110H257V150H225V182H185V150H153V110H185V78Z"/><path d="M43 130H116M294 130H367" opacity=".4"/></>}
      {kind==='hogar'&&<><path d="M87 121L202 45L317 121M110 107V210H294V107M174 210V137H231V210M135 132H157V161H135V132ZM249 132H272V161H249V132Z"/><path d="M70 220H333M135 78V57H155V65"/><path d="M202 45L317 121H294L202 61L110 121H87" opacity=".3"/></>}
      {kind==='empresas'&&<><path d="M104 213V93L190 48L274 91V213M104 93L190 137L274 91M190 137V214M274 125L329 151V213H70"/><path d="M120 115L173 142M120 140L173 167M120 166L173 193M207 143L255 117M207 169L255 143M207 194L255 169M290 158L314 169M290 182L314 193" opacity=".55"/></>}
      {kind==='asesoria'&&<><path d="M90 62H267V165H157L121 198V165H90V62Z"/><path d="M285 99H319V202H287L261 226V202H188V182"/><path d="M120 94H238M120 116H217M120 138H193" opacity=".55"/><circle cx="268" cy="62" r="21" fill="#E0E7DA"/><path d="M259 62L265 68L278 55"/></>}
    </g>
  </svg>;
}
