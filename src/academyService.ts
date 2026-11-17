import {collection,addDoc,doc,updateDoc,deleteDoc,onSnapshot,query,limit,serverTimestamp} from 'firebase/firestore';
import {useEffect,useState} from 'react';
import {db,companyId} from './firebase';
import type {Lesson} from './academyData';
const videos=()=>collection(db,'companies',companyId,'academyVideos');
export function useAcademyVideos(){
 const [items,setItems]=useState<Lesson[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{try{return onSnapshot(query(videos(),limit(100)),snap=>{setItems(snap.docs.map(d=>({...d.data(),id:d.id,source:'acos'}) as Lesson).filter(x=>/^[A-Za-z0-9_-]{11}$/.test(x.videoId)&&['finanzas','seguros','proteccion'].includes(x.track)));setLoading(false);setError('');},()=>{setError('No se pudieron consultar las publicaciones de ACOS.');setLoading(false);});}catch{setLoading(false);setError('Biblioteca no disponible.');}},[]);
 return {items,loading,error};
}
export async function publishLesson(input:Omit<Lesson,'id'|'source'>,id?:string){
 if(id)await updateDoc(doc(videos(),id),{...input,updatedAt:serverTimestamp()});
 else await addDoc(videos(),{...input,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
}
export async function removeLesson(id:string){await deleteDoc(doc(videos(),id));}
