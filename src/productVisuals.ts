/** Art direction only. Product names and audience membership remain in insuranceCatalog.ts.
 * Pexels source IDs and license are recorded in public/images/SOURCES.md.
 * Local fallbacks and an individual palette keep the site usable if the CDN is unavailable.
 */
export interface ProductVisual {
 photo:string; fallback:string; tone:string; ink:string; accent:string; position:string;
}
const photo=(id:number)=>'https://images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&cs=tinysrgb&w=1000';
export const productVisuals:Record<string,ProductVisual>={
 'vida':{photo:"/images/vida.webp",fallback:"/images/vida.webp",tone:'#344d42',ink:'#0c2625',accent:'#e9caaa',position:'center 42%'},
 'salud':{photo:"/images/salud.webp",fallback:"/images/salud.webp",tone:'#365d72',ink:'#092d40',accent:'#bce4e8',position:'center 40%'},
 'vehiculos':{photo:"/images/vehiculos.webp",fallback:"/images/vehiculos.webp",tone:'#415568',ink:'#101e2f',accent:'#d3e5ee',position:'center 52%'},
 'hogar':{photo:"/images/hogar.webp",fallback:"/images/hogar.webp",tone:'#71634b',ink:'#302d27',accent:'#e7cfa0',position:'center 50%'},
 'soa':{photo:photo(7607202),fallback:"/images/vehiculos.webp",tone:'#2c5a6a',ink:'#0a2636',accent:'#c1e5e7',position:'center 44%'},
 'viajes':{photo:photo(3140204),fallback:"/images/vehiculos.webp",tone:'#36708a',ink:'#102c41',accent:'#d4e8f7',position:'center 45%'},
 'accidentes':{photo:photo(20860580),fallback:"/images/salud.webp",tone:'#36736a',ink:'#102f32',accent:'#c6eadf',position:'center 45%'},
 'robos':{photo:photo(17440970),fallback:"/images/empresas.webp",tone:'#4f5260',ink:'#18212f',accent:'#d9e0e7',position:'center 42%'},
 'agricola':{photo:photo(8019123),fallback:"/images/negocio.webp",tone:'#71814c',ink:'#1e3828',accent:'#e8d5a4',position:'center 49%'},
 'gastos-medicos':{photo:photo(5214997),fallback:"/images/salud.webp",tone:'#4d8890',ink:'#113b49',accent:'#c9edf1',position:'center 42%'},
 'micro-seguro':{photo:"/images/negocio.webp",fallback:"/images/negocio.webp",tone:'#83674a',ink:'#332b28',accent:'#f2d6ab',position:'center 50%'},
 'maquinarias':{photo:photo(15370211),fallback:"/images/empresas.webp",tone:'#987a45',ink:'#33332d',accent:'#f1d18c',position:'center 51%'},
 'transportes':{photo:photo(4570838),fallback:"/images/vehiculos.webp",tone:'#396080',ink:'#0d2d43',accent:'#cde2f0',position:'center 52%'},
 'do':{photo:photo(8463151),fallback:"/images/asesoria.webp",tone:'#465b70',ink:'#182635',accent:'#e0c89f',position:'center 42%'},
 'eo':{photo:photo(8730759),fallback:"/images/asesoria.webp",tone:'#5e626b',ink:'#232e3b',accent:'#e6dfd1',position:'center 42%'},
 'incendios':{photo:photo(2282658),fallback:"/images/empresas.webp",tone:'#984b3e',ink:'#39262a',accent:'#f2c2a4',position:'center 45%'},
 'responsabilidad':{photo:photo(19895881),fallback:"/images/empresas.webp",tone:'#3e7068',ink:'#183c3b',accent:'#cfe8dd',position:'center 45%'},
 'contratista':{photo:photo(7937365),fallback:"/images/empresas.webp",tone:'#8a754e',ink:'#34352d',accent:'#ebd2a2',position:'center 39%'},
 'construccion':{photo:photo(31579486),fallback:"/images/empresas.webp",tone:'#4e687a',ink:'#193443',accent:'#d5e4ec',position:'center 44%'},
};
