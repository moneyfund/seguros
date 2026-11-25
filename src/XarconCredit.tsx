import {ArrowUpRight} from 'lucide-react';
import './xarcon-credit.css';
export const xarconWebsite='https://xarcon-creative.vercel.app/';
export default function XarconCredit(){
 return <a className="ac-xarcon-credit" href={xarconWebsite} target="_blank" rel="noopener noreferrer" aria-label="XARCON — visitar sitio web (se abre en otra pestaña)">XARCON <ArrowUpRight size={12} aria-hidden="true"/></a>;
}
