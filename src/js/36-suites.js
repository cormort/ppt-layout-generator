/* ---------- 套裝：一鍵把整份簡報換成同一套設計（配色＋字型＋每頁角色對應的版型） ----------
   單一版型好看，不代表整份簡報好看：一份簡報要「封面→章節→內容→數據→結語」都在
   同一個語言裡。這裡把這件事包成 8 套，套用時只換版型與樣式，內容一個字都不動。
   只換「結構頁」（封面、章節、目錄、一般文字、引言、表格、照片、結尾）。圖表、地圖、數據並列、重點方格、圖卡、
   商務（時間軸、流程、數據亮點…）、對比、直排的版型本身就是內容的形狀（折線換成直條、地圖換成長條、時間軸換成
   照片拼貼就錯了），所以不在 roles 裡：保留原版型，只吃新的配色與字型。 */
const SUITES=[
  {id:'annual',name:'年度報告',hint:'藏青金・封面→章節→數據→結語，正式、保守',
   color:'#1f3a5f',accent:'#c9a24a',tf:0,bf:0,
   roles:{cover:'split',sec:'secStrip',toc:'tocNum',text:'tList',quote:'tQuote',table:'tTable',photo:'arch',wall:'wall',closing:'thanks'}},
  {id:'lecture',name:'課程講義',hint:'墨綠米・巨字封面＋大字編號章節，字大、投影清楚',
   color:'#2f5a46',accent:'#d8b98a',tf:2,bf:0,
   roles:{cover:'cBig',sec:'bignum',toc:'tocNum',text:'tList',quote:'tQuote',table:'tTable',photo:'arch',wall:'wall',closing:'thanks'}},
  {id:'brand',name:'品牌提案',hint:'酒紅灰・雜誌風（襯線字、暖紙底），適合刊物與提案',
   color:'#7a2635',accent:'#a8a8a8',tf:3,bf:2,
   roles:{cover:'mCover',sec:'secFade',toc:'mIndex',text:'tText',quote:'tQuote',table:'tTable',photo:'circles',wall:'posterWall',closing:'thanks'}},
  {id:'review',name:'專案回顧',hint:'商務藍・海報字標封面＋滿版章節＋波浪分格，動態感強',
   color:'#1d5fa8',accent:'#38b2e8',tf:0,bf:0,
   roles:{cover:'cLockup',sec:'secFull',toc:'tocNum',text:'tList',quote:'tQuote',table:'tTable',photo:'waveBand',wall:'nightWall',closing:'thanks'}},
  {id:'tech',name:'科技發表',hint:'科技紫・三角切割封面＋弧面屏目錄＋蜂巢拼貼，適合產品發表、系統上線',
   color:'#3b2f8f',accent:'#22c3c3',tf:0,bf:0,
   roles:{cover:'triangle',sec:'secFull',toc:'screens',text:'tList',quote:'tQuote',table:'tTable',photo:'hex',wall:'nightWall',closing:'thanks'}},
  {id:'oriental',name:'東方雅韻',hint:'硃砂金・撕紙宣紙封面＋宣紙金句＋扇形畫廊，適合文化、節慶、典禮',
   color:'#8c2b1d',accent:'#b8925a',tf:1,bf:2,
   roles:{cover:'cnTear',sec:'secFade',toc:'ring',text:'tText',quote:'cnQuote',table:'tTable',photo:'fan',wall:'wall',closing:'thanks'}},
  {id:'event',name:'活動紀錄',hint:'深灰橘・層疊色帶封面＋弧頂照片分格，適合活動成果、社區與營隊紀錄',
   color:'#3b3f46',accent:'#f08a24',tf:0,bf:0,
   roles:{cover:'waves',sec:'bignum',toc:'fanToc',text:'tList',quote:'tQuote',table:'tTable',photo:'arch',wall:'wall',closing:'thanks'}},
  {id:'pitch',name:'新創提案',hint:'青綠橘・螢光標記封面＋霧面豎板目錄，年輕俐落，適合提案與募資',
   color:'#0f5f5a',accent:'#f2a541',tf:0,bf:0,
   roles:{cover:'cMarker',sec:'secStrip',toc:'glass',text:'tList',quote:'tQuote',table:'tTable',photo:'waveBand',wall:'posterWall',closing:'thanks'}},
];
const SUITEBY=Object.fromEntries(SUITES.map(s=>[s.id,s]));
/* 自訂套裝：把目前的配色＋字型＋「這一頁角色用哪個版型」存成一套，存在這台電腦 */
const CUSTOM_KEY='lgSuites';
function customSuites(){
  try{const a=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'[]');
    return Array.isArray(a)?a.filter(s=>s&&s.id&&s.roles&&HEXRE.test(s.color)&&HEXRE.test(s.accent)):[]}catch(e){return[]}
}
function writeCustom(list){try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(list))}catch(e){}}
const allSuites=()=>SUITES.concat(customSuites());
const isCustom=id=>!SUITEBY[id];
/* 把目前這份簡報的樣式存成一套：角色取「目前每一種角色第一次出現的版型」，
   缺的角色用年度報告補（這樣套到只有封面與內文的簡報也不會缺頁） */
function saveCurrentAsSuite(name){
  const nm=String(name||'').trim().slice(0,12);if(!nm)return null;
  const byRole={};
  for(const p of S.pages){const r=roleOf(p);if(r&&!byRole[r])byRole[r]=p.tpl}
  const roles={...SUITEBY.annual.roles,...byRole};
  const su={id:'my-'+Date.now().toString(36),name:nm,color:S.color,accent:S.accent,tf:S.tf,bf:S.bf,
    hint:'自訂・'+nm+'（'+S.pages.length+' 頁的樣式）',roles};
  const list=customSuites();list.push(su);writeCustom(list);
  return su;
}
function deleteSuite(id){
  const list=customSuites().filter(s=>s.id!==id);writeCustom(list);return list.length;
}
/* 清單變動（存檔、刪除）就重畫兩處的按鈕 */
function suitesChanged(){
  if(typeof drawSuites==='function'){suiteSig='';drawSuites()}
  if(typeof ribSuites==='function')ribSuites();
}
/* 版型 → 角色。分類只能猜到大方向（雜誌、地圖這些要逐一指名） */
const ROLE_BY_ID={thanks:'closing',mCover:'cover',mIndex:'toc',mFeature:'text',mColumns:'text',twMap:'data',
  cBig:'cover',cFrame:'cover',cMarker:'cover',cEcho:'cover',cLockup:'cover',cBand:'cover',ocean:'cover',duotone:'cover',
  kPortrait:'card',cutoutCard:'card',kPhoto:'card',kAnnounce:'card',kList:'card',kNumber:'card',kQuote:'card',petalFan:'card',
  split:'cover',wall:'wall',tGrid:'keep',tStats:'keep',vertical:'keep',cnQuote:'quote',cnTear:'cover',posterWall:'wall',nightWall:'wall',tQuote:'quote',tTable:'table'};
function roleOf(p){
  const id=p&&p.tpl,t=TPLBY[id];
  if(ROLE_BY_ID[id])return ROLE_BY_ID[id];
  if(!t)return 'text';
  if(t.cat==='cover')return 'cover';
  if(t.cat==='sec')return 'sec';
  if(t.cat==='toc')return 'toc';
  if(t.cat==='chart')return 'data';
  if(t.cat==='text')return 'text';
  if(t.cat==='card')return 'card';
  if(t.cat==='mag')return 'text';
  if(t.cat==='wall')return 'wall';
  if(t.cat==='biz'||t.cat==='cmp')return 'keep';
  return 'photo';
}
/* id 或中文名都認（命令列輸入「年度報告」也可以） */
const suiteFrom=v=>{v=String(v||'').trim();if(!v)return null;
  const all=allSuites();
  return all.find(s=>s.id===v)||all.find(s=>s.name===v)||all.find(s=>s.name.includes(v))||null};
/* 套用：opts.colors=false 時只換版型（命令列已經先套過顏色時用） */
function applySuite(id,{colors=true}={}){
  const su=suiteFrom(id);if(!su)return 0;
  if(colors){S.color=su.color;S.accent=su.accent;S.tf=su.tf;S.bf=su.bf}
  let n=0;
  for(const p of S.pages){
    const want=su.roles[roleOf(p)];
    if(!want||!TPLBY[want])continue;
    const next=tplFor(want);           /* 目前尺寸不支援時會換成相近的版型 */
    if(next!==p.tpl)n++;
    p.tpl=next;
  }
  /* 目前這一頁的版型也要同步，否則接下來 storePage() 會把舊版型寫回去 */
  if(S.pages[S.cur])S.tpl=S.pages[S.cur].tpl;
  return n;
}
/* 樣式窗格的套裝按鈕：用第 1 頁的內容、套裝的配色字型畫出它的封面，先看再套；目前樣式符合的那套標成選取。
   跟著頁面縮圖一起重畫（drawPages），內容沒變就不重畫 */
const suiteOn=su=>!!su&&S.color===su.color&&S.accent===su.accent&&S.tf===su.tf&&S.bf===su.bf;
let suiteSig='';
function drawSuites(){
  const p=S.pages[0];if(!p)return;
  const ids=p.sel.filter(id=>lib.some(x=>x.id===id));
  const sig=[S.ratio,JSON.stringify(ovOf(p)),ids.join(),S.logo,S.logoPos,S.logoSize,S.logoBg,S.footer,S.company,S.date,S.page,S.fs,S.bullet,S.bgOn,S.bg,S.single,S.focal].join('\u0001');
  if(sig!==suiteSig){
    suiteSig=sig;const imgs=imgsOf(ids,'thumb');
    $('suites').innerHTML=allSuites().map(su=>{const tpl=tplFor(su.roles.cover);
      const svg=withState({...ovOf(p),pageNo:0,tpl,color:su.color,accent:su.accent,tf:su.tf,bf:su.bf},()=>renderSVG(TPLBY[tpl],imgs,'su'+su.id+'_'));
      const del=isCustom(su.id)?`<span class="del" data-del="${su.id}" role="button" tabindex="0" aria-label="刪除 ${esc(su.name)}" title="刪除這個自訂套裝">✕</span>`:'';
      return`<button data-suite="${su.id}" title="${esc(su.hint)}">${svg}<span class="nm"><i style="background:${su.color}"></i><i style="background:${su.accent}"></i>${esc(su.name)}</span><span class="hint">${esc(su.hint)}</span>${del}</button>`}).join('');
  }
  for(const b of $('suites').children)b.setAttribute('aria-pressed',String(!!suiteOn(suiteFrom(b.dataset.suite))));
  if(typeof ribState==='function')ribState();
}
