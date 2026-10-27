/* ---------- 章節頁同步：整份的章節頁共用同一個版型與照片（預設開） ---------- */
const isSec=p=>TPLBY[p&&p.tpl]?.cat==='sec';
function syncSections({tpl=false,photo=false}={}){
  const cur=S.pages[S.cur];if(!S.secSync||!isSec(cur))return 0;let n=0;
  S.pages.forEach((p,i)=>{if(i===S.cur||!isSec(p))return;let ch=false;
    if(tpl&&p.tpl!==cur.tpl){p.tpl=cur.tpl;ch=true}
    /* 這一頁沒選照片時不往外同步，免得把其他章節頁的照片清掉 */
    if(photo&&cur.sel.length&&p.sel.join()!==cur.sel.join()){p.sel=[...cur.sel];ch=true}
    if(ch)n++});
  return n;
}
function refresh(){storePage();syncSections({photo:true});clearTimeout(tA);clearTimeout(tB);tA=setTimeout(drawStage,40);tB=setTimeout(()=>{drawGallery();drawPages()},240);histLater()}

/* ---------- 復原／重做：記錄文字、樣式、頁面、選圖順序、圖庫成員與裁切（介面偏好不記）；
   crop 欄位同時是「當時圖庫有哪些圖」的清單，移除的圖從回收區撈回來 ---------- */
const HIST={list:[],i:-1,t:0,lock:false},LOGOS=[''];
const NOHIST=['theme','cat','fmt','scale','fname','pptText','pptQ'];
function snapState(){
  const s={...S};for(const k of NOHIST)delete s[k];
  let li=LOGOS.indexOf(S.logo);if(li<0)li=LOGOS.push(S.logo)-1;s.logo=li;
  return JSON.stringify({s,sel,crop:lib.map(it=>[it.id,it.crop])});
}
function histCommit(){
  clearTimeout(HIST.t);if(HIST.lock)return;
  const j=snapState();if(HIST.list[HIST.i]===j)return;
  HIST.list=HIST.list.slice(0,HIST.i+1);HIST.list.push(j);
  if(HIST.list.length>100)HIST.list.shift();HIST.i=HIST.list.length-1;histUI();
}
function histLater(){if(HIST.lock)return;clearTimeout(HIST.t);HIST.t=setTimeout(histCommit,450)}
function histUI(){$('undo').disabled=HIST.i<=0;$('redo').disabled=HIST.i>=HIST.list.length-1}
function histGo(d){
  histCommit();const j=HIST.i+d;if(j<0||j>=HIST.list.length)return;
  HIST.i=j;const st=JSON.parse(HIST.list[j]);HIST.lock=true;
  try{
    const keep={};for(const k of NOHIST)keep[k]=S[k];
    Object.assign(S,sanitise({...st.s,logo:LOGOS[st.s.logo]||'',...keep}));
    const pool=new Map([...TRASH,...lib.map(it=>[it.id,it])]),want=st.crop.map(([id])=>pool.get(id)).filter(Boolean);
    for(const it of lib)if(!want.includes(it))TRASH.set(it.id,it);
    for(const it of want)if(!lib.includes(it))it.dirty=true;
    lib.length=0;lib.push(...want);
    const cm=new Map(st.crop);for(const it of lib)if(JSON.stringify(it.crop||null)!==JSON.stringify(cm.get(it.id)||null)){it.crop=cm.get(it.id)||null;it.dirty=true}
    libSave();
    sel=st.sel.filter(id=>lib.some(x=>x.id===id));
    syncUI();drawLib();drawAll();if(cropId)showCrop();save();
  }finally{HIST.lock=false}
  histUI();toast(d<0?'已復原':'已重做');
}
$('undo').onclick=()=>histGo(-1);$('redo').onclick=()=>histGo(1);
function drawStage(){
  const tpl=TPLBY[tplFor(S.tpl)];S.tpl=tpl.id;
  [W,H]=RATIOS[S.ratio];$('stage').style.setProperty('--ar',String(W/H));
  $('curName').innerHTML=`第 ${S.cur+1} / ${S.pages.length} 頁<small>${esc(tpl.name)}</small>`;
  const svg=renderSVG(tpl,chosen('full'),'m_');
  $('stage').innerHTML=svg;
  /* 屬性面板上方的「目前版型」卡片 */
  $('tplName').textContent=tpl.name;$('tplHint').textContent=tpl.hint;$('tplThumb').innerHTML=renderSVG(tpl,chosen('thumb'),'tc_');
  const n=overflowNote(svg),photo=usesPhoto(tpl)&&!sel.length;
  $('note').textContent=n||(photo?'目前用示意圖：到「照片」上傳並點選照片就會換上。':'✓ 文字都放得下');
  $('note').classList.toggle('warn',!!n);$('note').classList.toggle('ok',!n&&!photo);
  $('secSyncRow').hidden=tpl.cat!=='sec';
}
let galSig='';
/* 內容＋樣式的簽章（不含分類）：建議清單用；縮圖牆再加上分類 */
function contentSig(){return galSignature(true)}
function galSignature(noCat){
  return [sel.join(','),noCat?'':S.cat,S.ratio,S.title,S.subtitle,S.body,S.items,S.number,S.color,S.accent,S.bgOn,S.bg,S.single,S.focal,S.tf,S.bf,S.logo,S.logoSize,S.logoPos,S.logoBg,S.footer,S.company,S.date,S.page,S.fs,S.bullet,
    sel.map(id=>JSON.stringify(lib.find(x=>x.id===id)?.crop||0)).join()].join('\u0001');
}
function drawGallery(force){
  const tpl=TPLBY[tplFor(S.tpl)];S.tpl=tpl.id;
  const sig=galSignature();
  if(!force&&sig===galSig){
    $('gal').querySelectorAll('.card').forEach(c=>c.classList.toggle('on',c.dataset.id===tpl.id));
    return;
  }
  galSig=sig;
  const th=chosen('thumb');
  $('gal').innerHTML=tplList().map(t=>{const svg=renderSVG(t,th,'g'+t.id+'_'),ov=!!overflowNote(svg);
    return`<div class="card ${t.id===tpl.id?'on':''}" data-id="${t.id}" role="button" tabindex="0" aria-label="${esc(t.name)}${ov?'（文字放不下）':''}">${svg}${ov?'<span class="ov">放不下</span>':''}<div class="meta"><div class="nm">${esc(t.name)}</div><div class="hint">${esc(t.hint)}</div></div></div>`}).join('');
}
function drawAll(){drawStage();drawGallery(true);drawPages()}
function pickTpl(id){
  /* 章節頁換成另一個章節版型時，其他章節頁一起換（同一張照片） */
  const wasSec=TPLBY[S.tpl]?.cat==='sec';
  S.tpl=id;storePage();const n=wasSec?syncSections({tpl:true,photo:true}):0;
  save();drawStage();drawGallery();drawPages();histLater();
  if(n)toast(`已套用到全部章節頁（另外 ${n} 頁，同一張照片）；不要同步可關掉「章節頁同步」或按復原`);
  else if(MQ.matches)toast('已套用：'+(TPLBY[id]?.name||''));
}
$('gal').onclick=e=>{const c=e.target.closest('.card');if(!c)return;pickTpl(c.dataset.id)};
$('gal').onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const c=e.target.closest('.card');if(!c)return;e.preventDefault();pickTpl(c.dataset.id)};

