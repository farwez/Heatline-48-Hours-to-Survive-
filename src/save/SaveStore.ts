import {type State,validState} from '../missions/Campaign';
export class SaveStore {
 private db:Promise<IDBDatabase>;
 constructor(){this.db=new Promise((resolve,reject)=>{const r=indexedDB.open('heatline-campaign',1);r.onupgradeneeded=()=>r.result.createObjectStore('saves');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});this.db.catch(()=>{});}
 async save(state:State):Promise<void>{const snapshot=structuredClone(state);if(!validState(snapshot))throw new Error('Invalid checkpoint');try{const db=await this.db;await new Promise<void>((resolve,reject)=>{const t=db.transaction('saves','readwrite');t.objectStore('saves').put(snapshot,'checkpoint');t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}catch{localStorage.setItem('heatline-fallback',JSON.stringify(snapshot));}}
 async load():Promise<State|null>{try{const db=await this.db;const value=await new Promise<unknown>((resolve,reject)=>{const r=db.transaction('saves').objectStore('saves').get('checkpoint');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});if(validState(value))return value;}catch{/* Storage may be unavailable in private browsing. */}try{const v=JSON.parse(localStorage.getItem('heatline-fallback')||'null');return validState(v)?v:null;}catch{return null;}}
}
