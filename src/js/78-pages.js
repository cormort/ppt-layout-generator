/* ---------- 頁面清單：S 的單頁欄位與 sel 永遠是「目前這一頁」，切頁時才跟 S.pages 互換 ---------- */
const ovOf=p=>Object.fromEntries(PAGE_KEYS.map(k=>[k,p[k]]));
const pageOf=()=>({...ovOf(S),sel:[...sel]});
function storePage(){
  if(!S.pages.length)S.pages=[pageOf()];
  S.cur=clampNum(S.cur,0,S.pages.length-1,0);S.pages[S.cur]=pageOf();
}
function usePage(i){
  const p=S.pages[i];if(!p)return;S.cur=i;
  for(const k of PAGE_KEYS)S[k]=p[k];
  sel=p.sel.filter(id=>lib.some(x=>x.id===id));
}
function pageChanged(msg){closeCrop();syncUI();drawLib();drawAll();save();histLater();if(msg)toast(msg)}
function goPage(i){if(i===S.cur||!S.pages[i])return;storePage();usePage(i);pageChanged()}
function addPage(dup){
  storePage();const cur=S.pages[S.cur];
  const p=dup?{...cur,sel:[...cur.sel]}:{...cleanPage({tpl:cur.tpl,title:'新頁面'}),sel:[]};
  S.pages.splice(S.cur+1,0,p);usePage(S.cur+1);pageChanged(dup?'已複製這一頁':'已新增一頁');
}
function delPage(i){
  storePage();if(S.pages.length<2){toast('至少要保留一頁');return}
  const n=i<S.cur?S.cur-1:i===S.cur?Math.min(i,S.pages.length-2):S.cur;
  S.pages.splice(i,1);usePage(n);pageChanged(`已刪除第 ${i+1} 頁（可按復原）`);
}
function movePage(i,j){
  storePage();if(j<0||j>=S.pages.length||i===j)return;
  const cur=S.pages[S.cur],[m]=S.pages.splice(i,1);S.pages.splice(j,0,m);S.cur=S.pages.indexOf(cur);
  save();drawStage();drawPages();histLater();
}
/* 縮圖快取：頁面內容與共用樣式都沒變就不重畫 */
const pgCache=new Map();
function pageSVG(p,i){
  const ids=p.sel.filter(id=>lib.some(x=>x.id===id));
  const sig=[S.ratio,JSON.stringify(ovOf(p)),ids.join(),ids.map(id=>JSON.stringify(lib.find(x=>x.id===id).crop||0)).join(),
    S.color,S.accent,S.bgOn,S.bg,S.single,S.focal,S.tf,S.bf,S.logo,S.logoSize,S.logoPos,S.logoBg,S.footer,S.company,S.date,S.page,S.fs,S.bullet].join('\u0001');
  const c=pgCache.get(i);if(c&&c.sig===sig)return c.svg;
  const svg=withState({...ovOf(p),pageNo:i},()=>renderSVG(TPLBY[tplFor(p.tpl)],imgsOf(ids,'thumb'),'pg'+i+'_'));
  pgCache.set(i,{sig,svg});return svg;
}
function drawPages(){
  storePage();
  $('pgCount').textContent=S.pages.length;
  $('docTitle').textContent=deckName();$('docStat').textContent=`${S.pages.length} 頁・${S.ratio}・自動存在這台電腦`;$('expDeckHd').textContent=`整份簡報（${S.pages.length} 頁）`;
  $('pages').innerHTML=S.pages.map((p,i)=>`<div class="pg${i===S.cur?' on':''}" data-i="${i}" draggable="${FINE.matches}" role="button" tabindex="0" aria-current="${i===S.cur}" aria-label="第 ${i+1} 頁：${esc(p.title||TPLBY[p.tpl]?.name)}">${pageSVG(p,i)}<span class="b">${i+1}</span>${p.notes.trim()?'<span class="nt" title="這一頁有逐字稿">稿</span>':''}`+
    `<div class="ctl"><button data-a="l" aria-label="往前移" title="往前移">↑</button><button data-a="d" aria-label="複製這一頁" title="複製這一頁">⧉</button><button data-a="x" aria-label="刪除這一頁" title="刪除這一頁">✕</button><button data-a="r" aria-label="往後移" title="往後移">↓</button></div></div>`).join('')+
    '<button class="pgadd" id="pgAdd" title="在目前這一頁後面新增">＋<br>新增頁</button>';
  for(const k of[...pgCache.keys()])if(k>=S.pages.length)pgCache.delete(k);
}
$('pages').onclick=e=>{
  if(e.target.closest('#pgAdd')){addPage(false);return}
  const d=e.target.closest('.pg');if(!d)return;const i=+d.dataset.i,b=e.target.closest('button');
  if(!b){goPage(i);return}
  const a=b.dataset.a;
  if(a==='d'){goPage(i);addPage(true)}else if(a==='x')delPage(i);else movePage(i,a==='l'?i-1:i+1);
};
$('pages').onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const d=e.target.closest('.pg');if(!d||e.target.closest('button'))return;e.preventDefault();goPage(+d.dataset.i)};
{let dragP=null;const P=$('pages');
  P.addEventListener('dragstart',e=>{const d=e.target.closest('.pg');if(!d)return;dragP=+d.dataset.i;d.classList.add('drag');e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',String(dragP))}catch(_){}});
  P.addEventListener('dragover',e=>{if(dragP!=null)e.preventDefault()});
  P.addEventListener('drop',e=>{e.preventDefault();if(dragP==null)return;const d=e.target.closest('.pg'),j=d?+d.dataset.i:S.pages.length-1,i=dragP;dragP=null;
    if(i===j)drawPages();else movePage(i,j)});
  P.addEventListener('dragend',()=>{if(dragP!=null){dragP=null;drawPages()}});}
async function deckPages(){
  storePage();
  return Promise.all(S.pages.map(async(p,i)=>({tpl:TPLBY[tplFor(p.tpl)],imgs:await pageImages(p.sel),ov:{...ovOf(p),pageNo:i},notes:p.notes})));
}
const deckName=()=>safeName(S.fname||S.pages[0]?.title||'簡報');
$('deckOut').onclick=async()=>{
  const btn=$('deckOut');btn.disabled=true;
  try{
    const pages=await deckPages(),n=pages.length,withNotes=pages.filter(p=>p.notes.trim()).length;
    saveBlob(await buildPptx(pages,null,i=>toast(`製作投影片… ${i+1}/${n}`)),`${deckName()}_${n}頁.pptx`);
    toast(`已輸出 ${n} 頁 PPTX`+(withNotes?`，其中 ${withNotes} 頁有逐字稿`:''));
  }catch(e){console.error(e);toast('輸出失敗：'+e.message)}
  finally{btn.disabled=false}
};

/* ---------- HTML 播放器：播放模式與「匯出 HTML」共用同一份自給自足的網頁 ----------
   PLAYER／PRESENTER 兩個函式不在本頁執行，而是用 toString() 原樣放進產生的網頁裡跑 */
