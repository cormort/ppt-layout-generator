function PLAYER(){
  const D=window.__DECK,N=D.slides.length,$=id=>document.getElementById(id);
  const svgOf=i=>D.slides[i].svg.replace(/@@IMG(\d+)@@/g,(m,k)=>D.imgs[+k]);
  let cur=0,pres=null,hideT=0,typed='';
  function go(i){
    cur=Math.max(0,Math.min(N-1,i));
    $('stage').innerHTML=svgOf(cur);$('num').textContent=(cur+1)+' / '+N;
    try{history.replaceState(null,'','#'+(cur+1))}catch(e){}
    if(pres&&!pres.closed&&pres.__sync)pres.__sync(cur);
  }
  const next=()=>go(cur+1),prev=()=>go(cur-1);
  function black(){const b=$('black');b.hidden=!b.hidden;if(pres&&!pres.closed&&pres.__black)pres.__black(!b.hidden)}
  function full(){if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{})}
  function presenter(){
    if(pres&&!pres.closed){pres.focus();return}
    pres=window.open('','pptgen_presenter','width=1280,height=800');
    if(!pres){alert('瀏覽器擋住了彈出視窗：請允許這個頁面開新視窗，再按 P');return}
    pres.document.open();pres.document.write(D.presenterHtml);pres.document.close();
  }
  function help(on){const h=$('help');h.hidden=on===undefined?!h.hidden:!on}
  /* 簡報者檢視的按鍵也送到這裡處理 */
  function key(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key;
    if(/^\d$/.test(k)){typed+=k;return}
    if(k==='Enter'&&typed){e.preventDefault();go(+typed-1);typed='';return}
    typed='';
    if(['ArrowRight','ArrowDown','PageDown',' ','Enter','n','N'].includes(k)){e.preventDefault();next()}
    else if(['ArrowLeft','ArrowUp','PageUp','Backspace'].includes(k)){e.preventDefault();prev()}
    else if(k==='Home'){e.preventDefault();go(0)}else if(k==='End'){e.preventDefault();go(N-1)}
    else if(k==='f'||k==='F'){e.preventDefault();full()}
    else if(k==='p'||k==='P'){e.preventDefault();presenter()}
    else if(k==='b'||k==='B'||k==='.'||k==='w'||k==='W'){e.preventDefault();black()}
    else if(k==='?'||k==='h'||k==='H'){e.preventDefault();help()}
    else if(k==='Escape')help(false);
  }
  window.__P={N,svgOf,go,next,prev,black,key,cur:()=>cur,notes:i=>D.slides[i].notes||'',title:i=>D.slides[i].title||'',deck:D.title};
  document.addEventListener('keydown',key);
  /* 滑鼠移動才顯示控制列與游標 */
  const wake=()=>{$('bar').classList.add('show');document.body.classList.remove('idle');clearTimeout(hideT);hideT=setTimeout(()=>{$('bar').classList.remove('show');document.body.classList.add('idle')},2500)};
  document.addEventListener('mousemove',wake);
  $('bar').addEventListener('click',e=>{e.stopPropagation();const a=e.target.closest('button')?.dataset.a;
    if(a==='prev')prev();else if(a==='next')next();else if(a==='full')full();else if(a==='pres')presenter();else if(a==='black')black();else if(a==='help')help()});
  $('help').addEventListener('click',e=>{e.stopPropagation();help(false)});
  $('black').addEventListener('click',e=>{e.stopPropagation();black()});
  /* 點畫面左邊四分之一回上一頁，其他地方下一頁；觸控可左右滑動 */
  let sx=null;
  document.addEventListener('pointerdown',e=>{sx=e.pointerType==='mouse'?null:e.clientX});
  document.addEventListener('pointerup',e=>{if(sx===null)return;const dx=e.clientX-sx;sx=null;if(Math.abs(dx)>60){dx<0?next():prev();e.preventDefault()}});
  $('stage').addEventListener('click',e=>{e.clientX<innerWidth*.25?prev():next()});
  addEventListener('pagehide',()=>{try{if(pres&&!pres.closed)pres.close()}catch(e){}});
  const h=parseInt((location.hash||'').slice(1),10);
  go(h>0?h-1:D.start||0);wake();
  $('hint').classList.add('show');setTimeout(()=>$('hint').classList.remove('show'),4000);
}
function PRESENTER(){
  const M=window.opener&&window.opener.__P,$=id=>document.getElementById(id);
  if(!M){document.body.textContent='請從簡報視窗按 P 開啟簡報者檢視。';return}
  let fz=22,acc=0,t0=0,running=false;
  const el=()=>acc+(running?(Date.now()-t0)/1000:0);
  const fmt=s=>{s=Math.floor(s);const h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=s%60;return(h?h+':':'')+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')};
  function start(){if(running)return;running=true;t0=Date.now();$('tPlay').textContent='暫停'}
  function pause(){if(!running)return;acc=el();running=false;$('tPlay').textContent='繼續'}
  function render(i){
    $('cur').innerHTML=M.svgOf(i);
    $('nxt').innerHTML=i+1<M.N?M.svgOf(i+1):'<div class="end">簡報結束</div>';
    const n=M.notes(i);$('notes').textContent=n||'（這一頁沒有逐字稿）';$('notes').classList.toggle('none',!n);$('notes').scrollTop=0;
    $('cnt').textContent=(i+1)+' / '+M.N;$('ttl').textContent=M.title(i)||M.deck;
    if(i>0&&!running&&!acc)start();
  }
  window.__sync=render;window.__black=on=>$('blk').classList.toggle('on',on);
  document.addEventListener('keydown',e=>M.key(e));
  $('tPlay').onclick=()=>running?pause():start();
  $('tReset').onclick=()=>{acc=0;t0=Date.now()};
  $('prev').onclick=()=>M.prev();$('next').onclick=()=>M.next();
  $('fm').onclick=()=>{fz=Math.max(14,fz-2);$('notes').style.fontSize=fz+'px'};
  $('fp').onclick=()=>{fz=Math.min(48,fz+2);$('notes').style.fontSize=fz+'px'};
  setInterval(()=>{$('elapsed').textContent=fmt(el());$('clock').textContent=new Date().toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit',hour12:false})},500);
  render(M.cur());
}
/* U+2028／U+2029 在舊瀏覽器的 <script> 裡算換行，要跳脫 */
const jsSafe=v=>{const u=n=>String.fromCharCode(92)+'u'+n;return JSON.stringify(v).split('<').join(u('003c')).split(String.fromCharCode(0x2028)).join(u('2028')).split(String.fromCharCode(0x2029)).join(u('2029'))};
/* 每頁畫成完整 SVG（文字也在裡面）；同一張圖的 data URL 只存一次，用 @@IMGn@@ 代號 */
async function deckSlides(){
  const pages=await deckPages(),imgs=[],at=new Map();
  const slides=pages.map((p,i)=>{
    const svg=withState(p.ov,()=>renderSVG(p.tpl,p.imgs,'s'+i+'_')).replace(/href="(data:image\/[^"]+)"/g,(m,u)=>{let k=at.get(u);if(k===undefined){k=imgs.push(u)-1;at.set(u,k)}return`href="@@IMG${k}@@"`});
    return{svg,notes:p.notes||'',title:p.ov.title||''};
  });
  return{slides,imgs};
}
const PLAYER_FONT="'Microsoft JhengHei','PingFang TC','Noto Sans TC',system-ui,sans-serif";
function playerHtml(deck,{title='簡報',start=0}={}){
  const presenterHtml=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>簡報者檢視・${esc(title)}</title><style>
*{box-sizing:border-box}body{margin:0;height:100vh;background:#1b1c1f;color:#e9e9e9;font:15px/1.5 ${PLAYER_FONT};display:grid;grid-template-columns:1.55fr 1fr;grid-template-rows:auto 1fr;gap:14px;padding:14px}
header{grid-column:1/3;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
#ttl{font-weight:700;font-size:17px;margin-right:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:45vw}
.big{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums}.lab{font-size:12px;color:#9a9a9a;margin-right:4px}
button{background:#33363c;color:#eee;border:1px solid #4a4e55;border-radius:8px;padding:6px 12px;font:inherit;cursor:pointer}button:hover{background:#41454c}
#left{display:flex;flex-direction:column;gap:10px;min-height:0}#cur{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;background:#000;border-radius:8px;overflow:hidden}
#cur svg,#nxt svg{width:100%;height:100%;display:block}#nav{display:flex;gap:8px;justify-content:center}
#right{display:flex;flex-direction:column;gap:8px;min-height:0}#nxt{aspect-ratio:${W}/${H};width:min(100%,calc(42vh * ${f1(W/H)}));align-self:center;flex:none;background:#000;border-radius:8px;overflow:hidden;opacity:.9}
.end{height:100%;display:grid;place-items:center;color:#888}
#nh{display:flex;align-items:center;gap:6px}#nh span{margin-right:auto}
#notes{flex:1;min-height:0;overflow:auto;background:#24262b;border-radius:8px;padding:14px 16px;font-size:22px;line-height:1.7;white-space:pre-wrap}#notes.none{color:#888}
#blk{display:none;background:#b03a2e;color:#fff;border-radius:6px;padding:2px 8px;font-size:13px}#blk.on{display:inline}
</style></head><body><header><span id="ttl"></span><span id="blk">黑幕中</span><span><span class="lab">頁</span><span id="cnt" class="big"></span></span>
<span><span class="lab">經過</span><span id="elapsed" class="big">00:00</span></span><button id="tPlay">開始</button><button id="tReset">歸零</button><span><span class="lab">時間</span><span id="clock" class="big"></span></span></header>
<div id="left"><div id="cur"></div><div id="nav"><button id="prev">◀ 上一頁</button><button id="next">下一頁 ▶</button></div></div>
<div id="right"><div class="lab">下一頁</div><div id="nxt"></div><div id="nh"><span class="lab">逐字稿</span><button id="fm" title="字小一點">A−</button><button id="fp" title="字大一點">A＋</button></div><div id="notes"></div></div>
<script>(${PRESENTER})()<\/script></body></html>`;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="generator" content="圖片排版產生器">
<title>${esc(title)}</title><style>
html,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:${PLAYER_FONT}}body.idle{cursor:none}
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;touch-action:pan-y}#stage svg{width:100%;height:100%;display:block}
#black{position:fixed;inset:0;background:#000;z-index:5}
#bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);display:flex;gap:2px;align-items:center;background:rgba(24,24,24,.86);color:#fff;border-radius:999px;padding:5px 8px;font-size:14px;opacity:0;transition:opacity .3s;z-index:6;white-space:nowrap}
#bar.show{opacity:1}#bar button{background:none;border:0;color:#fff;font:inherit;padding:7px 11px;border-radius:999px;cursor:pointer}#bar button:hover{background:rgba(255,255,255,.16)}
#num{padding:0 8px;font-variant-numeric:tabular-nums}
#hint{position:fixed;top:18px;left:50%;transform:translateX(-50%);background:rgba(24,24,24,.86);color:#fff;border-radius:999px;padding:8px 16px;font-size:14px;opacity:0;transition:opacity .5s;pointer-events:none;z-index:6}#hint.show{opacity:1}
#help{position:fixed;inset:0;background:rgba(0,0,0,.72);color:#fff;display:grid;place-items:center;z-index:7}#help[hidden]{display:none}
#help div{background:#222;border-radius:14px;padding:22px 28px;line-height:2;font-size:16px}#help b{display:inline-block;min-width:150px;color:#ffd27a}
</style></head><body>
<div id="stage"></div><div id="black" hidden></div>
<div id="bar"><button data-a="prev" title="上一頁（←）">◀</button><span id="num"></span><button data-a="next" title="下一頁（→）">▶</button><button data-a="full" title="全螢幕（F）">全螢幕</button><button data-a="pres" title="簡報者檢視（P）">簡報者檢視</button><button data-a="black" title="黑幕（B）">黑幕</button><button data-a="help" title="快捷鍵（?）">?</button></div>
<div id="hint">← → 翻頁　F 全螢幕　P 簡報者檢視（逐字稿＋計時）　B 黑幕　? 說明</div>
<div id="help" hidden><div><b>→ ↓ 空白 PgDn</b>下一頁<br><b>← ↑ PgUp</b>上一頁<br><b>數字＋Enter</b>跳到第幾頁<br><b>Home／End</b>第一頁／最後一頁<br><b>F</b>全螢幕<br><b>P</b>簡報者檢視：逐字稿、下一頁、計時<br><b>B 或 .</b>黑幕<br><b>點畫面</b>左側上一頁、其他下一頁（手機可左右滑）</div></div>
<script>window.__DECK=${jsSafe({title,start,slides:deck.slides,imgs:deck.imgs,presenterHtml})}<\/script>
<script>(${PLAYER})()<\/script></body></html>`;
}
$('playBtn').onclick=async()=>{
  /* 先同步開視窗（避免被擋），再寫入內容 */
  const w=window.open('','_blank');if(!w){toast('瀏覽器擋住了新視窗，請允許本頁開彈出視窗');return}
  w.document.write('<p style="font:16px sans-serif;padding:24px">準備簡報中…</p>');
  try{storePage();const html=playerHtml(await deckSlides(),{title:deckName(),start:S.cur});w.document.open();w.document.write(html);w.document.close()}
  catch(e){console.error(e);w.close();toast('播放失敗：'+e.message)}
};
$('htmlOut').onclick=async()=>{
  const btn=$('htmlOut');btn.disabled=true;
  try{toast('產生 HTML 簡報中…');const deck=await deckSlides(),html=playerHtml(deck,{title:deckName()});
    saveBlob(new Blob([html],{type:'text/html;charset=utf-8'}),`${deckName()}_${deck.slides.length}頁.html`);
    const kb=new Blob([html]).size/1024,size=kb<1024?Math.max(1,Math.round(kb))+' KB':(kb/1024).toFixed(1)+' MB';
    toast(`已匯出 HTML 簡報（${deck.slides.length} 頁，${size}）：用瀏覽器開啟即可播放`)}
  catch(e){console.error(e);toast('匯出失敗：'+e.message)}finally{btn.disabled=false}
};

