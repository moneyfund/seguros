/** Reject a stalled UI operation without treating a timeout as a successful read.
 * The Firebase SDK may finish its underlying request afterward; the caller never uses that result.
 */
export function withDeadline<T>(work:Promise<T>,ms:number,message:string):Promise<T>{
 return new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(message)),ms);
  work.then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});
 });
}
