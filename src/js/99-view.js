/* ---------- 功能區（Ribbon）與檢視：桌面版的簡報軟體外觀 ----------
   功能區按鈕不自己做事，只轉呼叫既有的控制項，所以手機版（沒有功能區）與既有測試都照舊。 */
const RIB_FN={
  add:()=>addPage(false),dup:()=>addPage(true),del:()=>delPage(S.cur),
  up:()=>movePage(S.cur,S.cur-1),down:()=>movePage(S.cur,S.cur+1),
  play0:()=>play(0),
  /* 不擋冒泡的話，同一個 click 到 document 會被「點選單外面就關」立刻關掉 */
  expOpts:e=>{e.stopPropagation();$('expBtn').click()}
};
/* 窗格開關：記在這台電腦（沒有 localStorage 也照常運作） */
let VIEW={side:true,notes:true,insp:true};try{Object.assign(VIEW,JSON.parse(localStorage.getItem('lgView')||'{}'))}catch(e){}
function applyView(){
  for(const k in VIEW)document.body.classList.toggle('no-'+k,!VIEW[k]);
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(!!VIEW[b.dataset.view])));
  try{localStorage.setItem('lgView',JSON.stringify(VIEW))}catch(e){}
}
function openPane(t){if(!VIEW.insp){VIEW.insp=true;applyView()}setTab(t)}
function ribClick(e){
  const b=e.target.closest('button');if(!b)return;const d=b.dataset;
  if(d.rt){setRib(d.rt);return}
  if(d.fn)RIB_FN[d.fn](e);
  else if(d.do)$(d.do).click();
  else if(d.view){VIEW[d.view]=!VIEW[d.view];applyView()}
  else if(d.cat){openPane('tpl');const f=$('filters').querySelector(`[data-v="${d.cat}"]`);if(f)f.click();else toast('這個尺寸沒有這類版型')}
  else if(d.tab)openPane(d.tab);
  else if(d.focus){openPane('style');const el=$(d.focus);el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true})}
  else if(d.theme){$('theme').querySelector(`[data-v="${d.theme}"]`).click();ribState()}
  else if(d.suite){$('suites').querySelector(`[data-suite="${d.suite}"]`).click();ribState()}
}
let rib='home';try{rib=sessionStorage.getItem('lgRib')||'home'}catch(e){}
function setRib(t){
  rib=t;
  [...$('rtabs').children].forEach(b=>{const on=b.dataset.rt===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',String(on))});
  $('rbody').querySelectorAll('.rp').forEach(p=>p.classList.toggle('on',p.dataset.rp===t));
  try{sessionStorage.setItem('lgRib',t)}catch(e){}
}
/* 尺寸選單與外觀按鈕：清單取自既有的 RATIO_NAMES／THEMES，選了仍走原本的控制項 */
$('rRatio').innerHTML=RATIO_NAMES.map(([v,n])=>`<option value="${v}">${n}</option>`).join('');
$('rRatio').onchange=()=>{$('ratioSeg').querySelector(`[data-v="${$('rRatio').value}"]`).click();ribState()};
$('rTheme').innerHTML=THEMES.map(([v,n])=>`<button class="rb lg" data-theme="${v}"><svg viewBox="0 0 24 24">${v==='dark'?'<path class="a f" d="M19 14A8 8 0 019 4a8 8 0 1010 10z"/>':v==='light'?'<circle class="a" cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>':'<circle cx="12" cy="12" r="8"/><path class="a f" d="M12 4a8 8 0 000 16z"/>'}</svg>${n}</button>`).join('');
$('rSuite').innerHTML=SUITES.map(su=>`<button class="rb lg" data-suite="${su.id}" title="${esc(su.hint)}"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="12" height="14" rx="2" fill="${su.color}" stroke="none"/><rect x="16" y="5" width="5" height="14" rx="1.5" fill="${su.accent}" stroke="none"/></svg>${su.name}</button>`).join('');
/* 功能區是單列、視窗窄時會橫向捲動：右側補渐層與「»」按鈕，後面的群組才不會像不見了 */
let ribT=0;
function ribOverflow(){
  const rb=$('rbody'),more=$('ribMore');if(!rb||!more)return;
  const over=rb.scrollWidth>rb.clientWidth+2,atEnd=rb.scrollLeft+rb.clientWidth>=rb.scrollWidth-2;
  $('ribbon').classList.toggle('over',over&&!atEnd);
  $('ribbon').classList.toggle('over-l',over&&rb.scrollLeft>2);
  more.hidden=!over;
}
$('ribMore').onclick=e=>{e.stopPropagation();const rb=$('rbody');
  rb.scrollTo({left:rb.scrollLeft+rb.clientWidth*.72,behavior:'smooth'});setTimeout(ribOverflow,320)};
$('rbody').addEventListener('scroll',ribOverflow,{passive:true});
addEventListener('resize',()=>{clearTimeout(ribT);ribT=setTimeout(ribOverflow,120)});
function ribState(){
  document.querySelectorAll('#rSuite [data-suite]').forEach(b=>b.setAttribute('aria-pressed',String(suiteOn(SUITEBY[b.dataset.suite]))));
  $('rRatio').value=S.ratio;
  document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===S.theme)));
  $('stSlide').textContent=`投影片 ${S.cur+1} / ${S.pages.length}`;$('stRatio').textContent=S.ratio;
  ribOverflow();
}
$('ribbon').onclick=ribClick;$('status').onclick=ribClick;document.querySelector('.ihd').onclick=ribClick;
/* 尺寸、頁數、外觀可能從別處改（樣式窗格、復原、開專案），畫布重畫時順便更新 */
new MutationObserver(ribState).observe($('curName'),{childList:true});
setRib(rib);applyView();ribState();setTimeout(ribOverflow,0);
