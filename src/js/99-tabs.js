/* ---------- 分頁：桌面是右側屬性面板的四個分頁；手機多一個「頁面」，放在底部 ---------- */
const MQ=matchMedia('(max-width:900px)');
const TABS=['pages','content','tpl','photo','style'],OLDTAB={img:'photo',txt:'content',sty:'style',out:'content'};
let tab='content';try{const v=sessionStorage.getItem('lgTab');tab=OLDTAB[v]||v||'content'}catch(e){}
function setTab(t){
  if(!TABS.includes(t))t='content';
  const pane=t==='pages'?'content':t;tab=t;document.body.dataset.tab=t;
  [...$('tabs').children].forEach(b=>{const on=b.dataset.tab===t;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))});
  [...$('itabs').children].forEach(b=>{const on=b.dataset.tab===pane;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on))});
  document.querySelectorAll('.insp .pn').forEach(p=>p.classList.toggle('on',p.dataset.pn===pane));
  try{sessionStorage.setItem('lgTab',t)}catch(e){}
  if(MQ.matches)window.scrollTo({top:0});
}
$('tabs').onclick=e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.tab)};
$('itabs').onclick=e=>{const b=e.target.closest('button');if(b)setTab(b.dataset.tab)};
/* 逐字稿：桌面放在畫布正下方（像 PowerPoint 的備忘稿），手機放進「內容」分頁 */
function placeNotes(){
  const nb=$('notesBox'),home=MQ.matches?$('pnContent'):document.querySelector('.center');
  if(nb.parentNode!==home)home.appendChild(nb);
}
MQ.addEventListener('change',()=>{placeNotes();setTab(tab)});

/* 分享（手機上可直接傳到相簿、LINE 等） */
const shareFile=(b,name)=>new File([b],name,{type:b.type});
if(navigator.canShare&&navigator.canShare({files:[new File([''],'a.png',{type:'image/png'})]})){
  $('share').hidden=false;
  $('share').onclick=async()=>{
    try{
      const tpl=TPLBY[S.tpl]||TPL[0],imgs=await currentImages();toast('準備分享…');
      const b=S.fmt==='pptx'?await buildPptx([{tpl,imgs,ov:null,notes:S.notes}]):await exportBlob(tpl,S.fmt==='svg'?'png':S.fmt,Math.min(S.scale,2),imgs);
      const ext=S.fmt==='pptx'?'pptx':S.fmt==='jpeg'?'jpg':'png';
      await navigator.share({files:[shareFile(b,`${baseName()}_${tpl.id}.${ext}`)],title:S.title||'排版'});
    }catch(e){if(e&&e.name!=='AbortError')toast('分享失敗：'+e.message)}
  };
}

/* 安裝成 App（PWA） */
let installEvt=null;
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;$('install').hidden=false});
$('install').onclick=async()=>{if(!installEvt)return;installEvt.prompt();await installEvt.userChoice;installEvt=null;$('install').hidden=true};
addEventListener('appinstalled',()=>{$('install').hidden=true;toast('已安裝，可從桌面直接開啟')});
const isIOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
if(isIOS&&!standalone)$('iosHint').hidden=false;
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  navigator.serviceWorker.register('./sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;
      w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('已有新版本，重新開啟後就會套用')})});
  }).catch(e=>console.warn('SW',e));
  /* Android 從相簿「分享」到本 App 的圖片：由 sw.js 暫存，這裡讀進圖庫 */
  if(new URLSearchParams(location.search).has('shared'))(async()=>{
    try{const c=await caches.open('lg-share'),keys=await c.keys(),files=[];
      for(const k of keys){const r=await c.match(k);const b=await r.blob();files.push(new File([b],decodeURIComponent(k.url.split('/').pop())||'shared',{type:b.type}));await c.delete(k)}
      history.replaceState(null,'',location.pathname);
      await READY;if(files.length){setTab('photo');await addFiles(files)}
    }catch(e){console.warn(e)}})();
}

samples=makeSamples();
/* 先用示意圖畫出畫面，圖庫從 IndexedDB 還原後再把各頁的照片接回去 */
const keepSel=S.pages.map(p=>[...p.sel]);
if(S.pages.length)usePage(S.cur);else storePage();
placeNotes();setTab(tab);
syncUI();
drawLib();
drawAll();
histCommit();
const READY=libRestore().then(()=>{
  const ids=new Set(lib.map(x=>x.id));let lost=0;
  S.pages.forEach((p,i)=>{const want=keepSel[i]||[];p.sel=want.filter(id=>ids.has(id));lost+=want.length-p.sel.length});
  usePage(S.cur);drawLib();drawAll();save();
  HIST.list=[];HIST.i=-1;histCommit();
  if(lost)toast(lib.length?`有 ${lost} 張照片找不到，那幾頁暫用示意圖`:'上次的照片沒有保留下來（瀏覽器資料可能被清除）；可用「載入專案」開啟 .pptgen.json');
});
