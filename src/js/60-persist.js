/* ---------- 圖庫持久化：原圖、縮圖、裁切存在 IndexedDB，重新整理後各頁的照片仍在 ---------- */
const IDB={db:null,t:0,warned:false};
const idbReq=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
function idbOpen(){
  if(!('indexedDB' in window))return Promise.reject(new Error('no indexedDB'));
  const r=indexedDB.open('layoutGen',1);r.onupgradeneeded=()=>r.result.createObjectStore('imgs',{keyPath:'id'});return idbReq(r);
}
function libSave(it){if(it)it.dirty=true;clearTimeout(IDB.t);IDB.t=setTimeout(libFlush,500)}
async function libFlush(){
  clearTimeout(IDB.t);if(!IDB.db)return;
  try{
    const tx=IDB.db.transaction('imgs','readwrite'),st=tx.objectStore('imgs'),have=new Set(lib.map(x=>x.id));
    for(const k of await idbReq(st.getAllKeys()))if(!have.has(k))st.delete(k);
    for(const it of lib)if(it.dirty){st.put({id:it.id,name:it.name,blob:it.blob,tblob:it.tblob,w:it.w,h:it.h,crop:it.crop||null,cutout:!!it.cutout,blend:it.blend||'',op:it.op??1});it.dirty=false}
    await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=tx.onabort=()=>rej(tx.error)});
  }catch(e){console.warn('idb',e);if(!IDB.warned){IDB.warned=true;toast('瀏覽器空間不足，照片無法自動保留；請用「專案存檔」保存')}}
}
async function libRestore(){
  try{IDB.db=await idbOpen()}catch(e){console.warn('idb',e);return}
  try{
    const rows=await idbReq(IDB.db.transaction('imgs').objectStore('imgs').getAll());
    for(const r of rows.sort((a,b)=>a.id-b.id)){
      if(!(r.blob instanceof Blob)||lib.some(x=>x.id===r.id))continue;const tb=r.tblob instanceof Blob?r.tblob:r.blob;
      lib.push({id:r.id,name:String(r.name||'image'),blob:r.blob,tblob:tb,full:URL.createObjectURL(r.blob),thumb:URL.createObjectURL(tb),w:r.w,h:r.h,crop:cleanCrop(r.crop),cutout:!!r.cutout,blend:String(r.blend||''),op:typeof r.op==='number'?r.op:1});
      nid=Math.max(nid,r.id);
    }
  }catch(e){console.warn('idb',e)}
}
addEventListener('pagehide',()=>{libFlush()});
/* 同一個瀏覽器開了兩個分頁時，存檔是「最後寫的人贏」，互相提醒 */
if('BroadcastChannel' in window){
  const bc=new BroadcastChannel('layoutGen'),me=Math.random().toString(36).slice(2);let warned=false;
  const warn=()=>{if(warned)return;warned=true;toast('這個工具在另一個分頁也開著；兩邊同時編輯會互相覆蓋，請只留一個分頁')};
  bc.onmessage=e=>{const m=e.data||{};if(m.from===me)return;if(m.t==='hello')bc.postMessage({t:'here',from:me});warn()};
  bc.postMessage({t:'hello',from:me});
}

let saveT=0,savePrev='',dirty=false;
function flushSave(){
  clearTimeout(saveT);saveT=0;
  if(!dirty)return;dirty=false;
  try{const j=JSON.stringify(S);if(j===savePrev)return;savePrev=j;localStorage.setItem(LSKEY,j)}catch(e){}
}
const save=()=>{dirty=true;clearTimeout(saveT);saveT=setTimeout(flushSave,400)};
addEventListener('pagehide',flushSave);
addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushSave()});
const $=id=>document.getElementById(id);
const toast=m=>{const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2400)};

