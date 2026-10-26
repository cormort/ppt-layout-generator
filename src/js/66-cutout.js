/* ---------- 去背：四邊取樣參考色 → 連通洪水填充 → alpha 羽化。純 canvas，沒有外部程式庫 ---------- */
async function cutoutBitmap(blob,tol){
  const bmp=await createImageBitmap(blob);
  const cv=document.createElement('canvas');cv.width=bmp.width;cv.height=bmp.height;
  const x=cv.getContext('2d',{willReadFrequently:true});x.drawImage(bmp,0,0);
  const w=cv.width,h=cv.height,img=x.getImageData(0,0,w,h),px=img.data;
  /* 1. 四邊多點取樣，聚成最多 6 個參考色（漸層背景不會只認一個顏色） */
  const refs=[];
  const addRef=(px_,py)=>{const i=(py*w+px_)*4,r=px[i],g=px[i+1],b=px[i+2];
    if(!refs.some(q=>Math.abs(q[0]-r)+Math.abs(q[1]-g)+Math.abs(q[2]-b)<26)&&refs.length<6)refs.push([r,g,b])};
  for(let k=0;k<14;k++){
    const t1=Math.round((k+.5)/14*(w-1)),t2=Math.round((k+.5)/14*(h-1));
    addRef(t1,0);addRef(t1,h-1);addRef(0,t2);addRef(w-1,t2);
  }
  const thr=Math.max(12,tol*3);
  const isBg=i=>{const r=px[i],g=px[i+1],b=px[i+2];
    for(const q of refs)if(Math.abs(q[0]-r)+Math.abs(q[1]-g)+Math.abs(q[2]-b)<=thr)return true;return false};
  /* 2. 從框邊往內做洪水填充：只吃「和邊界連通」的背景，主體裡的同色不會被挖掉 */
  const seen=new Uint8Array(w*h),stk=new Int32Array(w*h);let sp=0;
  const seed=(px_,py)=>{const p=py*w+px_;if(!seen[p]&&isBg(p*4)){seen[p]=1;stk[sp++]=p}};
  for(let i=0;i<w;i++){seed(i,0);seed(i,h-1)}
  for(let j=0;j<h;j++){seed(0,j);seed(w-1,j)}
  while(sp>0){
    const p=stk[--sp];px[p*4+3]=0;
    const cx=p%w,cy=(p-cx)/w;
    if(cx>0){const q=p-1;if(!seen[q]&&isBg(q*4)){seen[q]=1;stk[sp++]=q}}
    if(cx<w-1){const q=p+1;if(!seen[q]&&isBg(q*4)){seen[q]=1;stk[sp++]=q}}
    if(cy>0){const q=p-w;if(!seen[q]&&isBg(q*4)){seen[q]=1;stk[sp++]=q}}
    if(cy<h-1){const q=p+w;if(!seen[q]&&isBg(q*4)){seen[q]=1;stk[sp++]=q}}
  }
  /* 3. alpha 做一次 3×3 平均：邊緣變柔順（大面積同值的地方不會改變） */
  const al=new Uint8ClampedArray(w*h);
  for(let i=0,p=3;i<w*h;i++,p+=4)al[i]=px[p];
  const sm=new Uint8ClampedArray(w*h);
  for(let j=0;j<h;j++){
    const y0=j>0?j-1:0,y1=j<h-1?j+1:h-1;
    for(let i=0;i<w;i++){
      const x0=i>0?i-1:0,x1=i<w-1?i+1:w-1;let sum=0,n=0;
      for(let yy=y0;yy<=y1;yy++){const row=yy*w;for(let xx=x0;xx<=x1;xx++){sum+=al[row+xx];n++}}
      sm[j*w+i]=sum/n;
    }
  }
  let clear=0;
  for(let i=0,p=3;i<w*h;i++,p+=4){if(al[i]===0)continue;px[p]=sm[i];if(sm[i]===0)clear++}
  x.putImageData(img,0,0);
  const out=await new Promise(r=>cv.toBlob(r,'image/png'));
  if(bmp.close)bmp.close();
  return {bmp:await createImageBitmap(out),empty:clear>0};
}
async function doCutout(){
  const it=cropItem();if(!it)return;
  const tol=+$('cutTol').value,btn=$('cutGo');
  btn.disabled=true;toast('去背處理中…（大圖要幾秒）');
  try{
    const r=await cutoutBitmap(it.blob,tol);
    const nu=await makeItem(it.name.replace(/\.[^.]+$/,'')+'（去背）',r.bmp,null,{cutout:true});
    if(r.bmp.close)r.bmp.close();
    /* 直接換成去背版：每一頁用到這張圖的位置都換過去，原圖留在圖庫 */
    if(sel.includes(it.id))sel=sel.map(i=>i===it.id?nu.id:i);
    S.pages.forEach(p=>{p.sel=p.sel.map(i=>i===it.id?nu.id:i)});
    closeCrop();drawLib();refresh();
    toast('已去背：背景變透明，原圖還留在圖庫。去背版會完整顯示、不裁切');
  }catch(e){console.warn(e);toast('這張圖去背失敗，換一張試試')}
  btn.disabled=false;
}
async function addFiles(files){
  const fs=[...files].filter(f=>f&&f.type&&f.type.startsWith('image/'));
  if(!fs.length){toast('沒有可用的圖片檔');return}
  toast(`處理 ${fs.length} 張圖片中…`);
  let ok=0;const queue=[...fs];
  const worker=async()=>{while(queue.length){const f=queue.shift();
    try{const bmp=await createImageBitmap(f);const it=await makeItem(f.name||'image',bmp);if(bmp.close)bmp.close();sel.push(it.id);ok++}catch(e){console.warn('skip',f.name,e)}}};
  await Promise.all(Array.from({length:Math.min(3,fs.length)},worker));
  drawLib();refresh();toast(ok?`已加入 ${ok} 張`:'這些檔案讀不進來，換成 JPG／PNG 試試');
}
const blobToData=b=>new Promise(r=>{const fr=new FileReader();fr.onload=()=>r(fr.result);fr.readAsDataURL(b)});
/* 移除的圖先放回收區（不釋放網址），按復原時才救得回來 */
const TRASH=new Map();
const TRASH_MAX=30;
function dropItem(it){
  TRASH.set(it.id,it);
  /* 回收區只留最近 30 張，更早的才真正釋放（之後就無法再復原） */
  for(const[id,old]of TRASH){if(TRASH.size<=TRASH_MAX)break;if(lib.includes(old))continue;TRASH.delete(id);URL.revokeObjectURL(old.full);URL.revokeObjectURL(old.thumb)}
  libSave();
}

function cleanCrop(c){if(!c||typeof c!=='object')return null;return{z:clampNum(c.z,1,4,1),fx:clampNum(c.fx,0,1,.5),fy:clampNum(c.fy,0,1,.5)}}
const imgOf=(it,src)=>({src,w:it.w,h:it.h,crop:it.crop||null,cutout:!!it.cutout,blend:it.blend||'',op:it.op??1});
function imgsOf(ids,kind){const L=ids.map(id=>lib.find(x=>x.id===id)).filter(Boolean);
  if(!L.length)return samples.map(s=>imgOf(s,s.src));return L.map(x=>imgOf(x,x[kind]))}
const chosen=kind=>imgsOf(sel,kind);
async function pageImages(ids){
  const L=ids.map(id=>lib.find(x=>x.id===id)).filter(Boolean);
  if(!L.length)return samples.map(s=>imgOf(s,s.data));
  return Promise.all(L.map(async it=>imgOf(it,it.data||(it.data=await blobToData(it.blob)))));
}
const currentImages=()=>pageImages(sel);
function colors(){const m=S.color,dark=mix(m,'#000000',.45),paper=S.bgOn&&HEXRE.test(S.bg)?S.bg:null;
  const[r,g,b]=paper?hex2rgb(paper):[255,255,255],dk=(.299*r+.587*g+.114*b)/255<.5;
  return{main:m,acc:S.accent||m,dark,soft:mix(m,'#ffffff',.55),light:mix(m,'#ffffff',.9),paper,dk,mt:dk&&(.299*hex2rgb(m)[0]+.587*hex2rgb(m)[1]+.114*hex2rgb(m)[2])/255<.55?mix(m,'#ffffff',.5):m,
    ink:dk?mix(m,'#ffffff',.88):dark,mute:dk?'rgba(255,255,255,.72)':'#555'}}
/* 頁碼：「頁碼」欄是第 1 頁的寫法，之後每頁自動遞增（P.01 → P.02…）；
   S.pageNo 由縮圖／整份輸出暫時指定，平常用目前這一頁 */
function pageLabel(){
  const seed=String(S.page||'').trim();if(!seed)return '';
  const i=Number.isInteger(S.pageNo)?S.pageNo:S.cur;return numberSeq(seed,i+1)[i];
}
/* logo + footer drawn on top of every template */
function chrome(c){
  let s='';const pos=S.logoPos||'tr';
  if(S.logo){const h=S.logoSize,w=Math.min(560,h*S.logoAR),p=14,x=pos[1]==='r'?W-40-w-p*2:40,y=pos[0]==='t'?36:H-36-h-p*2;
    if(S.logoBg)s+=`<rect x="${f1(x)}" y="${y}" width="${f1(w+p*2)}" height="${h+p*2}" rx="14" fill="#fff" opacity=".92"/>`;
    s+=`<image href="${S.logo}" x="${f1(x+p)}" y="${y+p}" width="${f1(w)}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`}
  const t=S.footer?[S.company,S.date,pageLabel()].map(v=>String(v||'').trim()).filter(Boolean).join('   |   '):'';
  if(t){const w=tw(t,20,c.bf,600)+40,left=S.logo&&pos==='br',x=left?40:W-40-w;
    s+=`<rect x="${f1(x)}" y="${H-72}" width="${f1(w)}" height="40" rx="20" fill="#fff" opacity=".88"/>`+T([t],{x:x+w/2,y:H-45,size:20,fill:'#444',font:c.bf,weight:600,anchor:'middle',fixed:true})}
  return s;
}
function renderSVG(tpl,imgs,pre){
  FS=S.fs/100;[W,H]=RATIOS[S.ratio]||RATIOS['16:9'];
  let k=0;const c={imgs,t:S,col:colors(),tf:FONTS[S.tf][1],bf:FONTS[S.bf][1],single:S.single,id:()=>pre+'x'+(k++),sh:pre+'sh',ts:pre+'ts'};
  const inner=tpl.render(c);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><clipPath id="${pre}frame"><rect width="${W}" height="${H}"/></clipPath>`+
   `<filter id="${pre}sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity=".22"/></filter>`+
   `<filter id="${pre}ts" x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="5" flood-color="#000" flood-opacity=".55"/></filter></defs><g clip-path="url(#${pre}frame)">${inner}${chrome(c)}</g></svg>`;
}

