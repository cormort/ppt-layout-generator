/* ---------- state ---------- */
const TPLBY=Object.fromEntries(TPL.map(t=>[t.id,t]));
/* 版型是否支援目前的版面尺寸；不支援時換成相近的版型（16:9 ↔ 圖卡） */
const tplOK=t=>(t.ratios||['16:9']).includes(S.ratio);
/* 會用到照片的版型（沒選照片時以示意圖代替） */
const usesPhoto=t=>!(t.cat==='text'||t.cat==='chart'||t.cat==='map'||['kAnnounce','kList','kNumber','kQuote','cnQuote','thanks','mColumns','mIndex','tocNum'].includes(t.id));
const TO_CARD={text:'tList',cover:'kPhoto',shape:'kPhoto',sec:'kNumber',toc:'kList',grid:'kPhoto',biz:'kAnnounce',cn:'kPhoto',mag:'kPhoto',chart:'tList',map:'tList'};
const TO_WIDE={kList:'tList',kPhoto:'split',kNumber:'bignum',kQuote:'tQuote',kAnnounce:'tText'};
function tplFor(id){
  const t=TPLBY[id];if(t&&tplOK(t))return id;
  const byId={mIndex:'tList',mColumns:'tText'};
  const alt=!t?null:S.ratio==='16:9'?TO_WIDE[id]:(byId[id]||TO_CARD[t.cat]);
  return alt&&TPLBY[alt]&&tplOK(TPLBY[alt])?alt:TPL.find(tplOK).id;
}
/* 把任意來源（localStorage／專案檔）的資料洗成合法狀態 */
function sanitise(raw){
  raw=raw&&typeof raw==='object'?raw:{};
  const s={...DEF};
  for(const k of Object.keys(DEF)){
    const v=raw[k];
    if(v===undefined||v===null)continue;
    if(typeof v===typeof DEF[k])s[k]=v;
  }
  if(!HEXRE.test(s.color))s.color=DEF.color;
  if(!HEXRE.test(s.accent))s.accent=DEF.accent;
  if(!HEXRE.test(s.bg))s.bg=DEF.bg;
  s.tf=clampNum(s.tf,0,FONTS.length-1,0);s.bf=clampNum(s.bf,0,FONTS.length-1,0);
  if(!TPLBY[s.tpl])s.tpl=TPL[0].id;
  if(!FOCAL.includes(s.focal))s.focal='xMidYMid';
  if(!['auto','light','dark'].includes(s.theme))s.theme='auto';
  if(!['png','jpeg','svg','pptx'].includes(s.fmt))s.fmt='png';
  if(!RATIOS[s.ratio])s.ratio='16:9';
  if(!['edit','flow','image'].includes(s.pptText))s.pptText='edit';
  if(!['std','small'].includes(s.pptQ))s.pptQ='std';
  s.fs=clampNum(s.fs,70,140,100);
  s.scale=clampNum(s.scale,1,3,2);
  s.logoSize=clampNum(s.logoSize,30,160,70);
  s.logoAR=clampNum(s.logoAR,.15,8,1);
  if(typeof s.logo!=='string'||!/^data:image\//.test(s.logo))s.logo='';
  if(!CATS.some(c=>c[0]===s.cat))s.cat='all';
  for(const k of ['title','subtitle','body','items','number','company','date','page','fname','notes'])s[k]=String(s[k]??'');
  for(const k of ['single','bgOn','footer','logoBg','secSync'])s[k]=!!s[k];
  s.pages=Array.isArray(s.pages)?s.pages.slice(0,MAXPAGES).map(cleanPage):[];
  s.cur=clampNum(Math.round(s.cur),0,Math.max(0,s.pages.length-1),0);
  return s;
}
/* 每頁各自的欄位；其餘（配色、字體、Logo、頁尾…）整份共用 */
const PAGE_KEYS=['tpl','title','subtitle','body','items','number','notes'],MAXPAGES=500;
function cleanPage(p){
  p=p&&typeof p==='object'?p:{};const o={};
  for(const k of PAGE_KEYS)o[k]=String(p[k]??'');
  if(!TPLBY[o.tpl])o.tpl=TPL[0].id;
  o.sel=Array.isArray(p.sel)?p.sel.filter(Number.isInteger):[];
  return o;
}
function loadState(){
  let raw={};
  try{raw=JSON.parse(localStorage.getItem(LSKEY)||localStorage.getItem(OLDLKEY)||'{}')||{}}catch(e){}
  /* 各頁的圖片編號先保留，等 IndexedDB 的圖庫還原後再核對（見最下方啟動流程） */
  return sanitise(raw);
}
const S=loadState();
const lib=[];let sel=[];let samples=[];let nid=0;

