/* ---------- 套裝：一鍵把整份簡報換成同一套設計（配色＋字型＋每頁角色對應的版型） ----------
   單一版型好看，不代表整份簡報好看：一份簡報要「封面→章節→內容→數據→結語」都在
   同一個語言裡。這裡把這件事包成 4 套，套用時只換版型與樣式，內容一個字都不動。 */
const SUITES=[
  {id:'annual',name:'年度報告',hint:'藏青金・封面→章節→數據→結語，正式、保守',
   color:'#1f3a5f',accent:'#c9a24a',tf:0,bf:0,
   roles:{cover:'split',sec:'secStrip',toc:'tocNum',text:'tList',data:'cBar',quote:'tQuote',table:'tTable',photo:'diagTime',wall:'wall',card:'cards',closing:'thanks'}},
  {id:'lecture',name:'課程講義',hint:'墨綠米・巨字封面＋大字編號章節，字大、投影清楚',
   color:'#2f5a46',accent:'#d8b98a',tf:2,bf:0,
   roles:{cover:'cBig',sec:'bignum',toc:'tocNum',text:'tList',data:'cBar',quote:'tQuote',table:'tTable',photo:'curve',wall:'wall',card:'cards',closing:'thanks'}},
  {id:'brand',name:'品牌提案',hint:'酒紅灰・雜誌風（襯線字、暖紙底），適合刊物與提案',
   color:'#7a2635',accent:'#a8a8a8',tf:3,bf:2,
   roles:{cover:'mCover',sec:'secFade',toc:'mIndex',text:'tText',data:'cBar',quote:'tQuote',table:'tTable',photo:'posterWall',wall:'posterWall',card:'kPortrait',closing:'thanks'}},
  {id:'review',name:'專案回顧',hint:'商務藍・海報字標封面＋時程／滿版章節，動態感強',
   color:'#1d5fa8',accent:'#38b2e8',tf:0,bf:0,
   roles:{cover:'cLockup',sec:'secFull',toc:'tocNum',text:'tList',data:'cBar',quote:'tQuote',table:'tTable',photo:'diagTime',wall:'nightWall',card:'kpi',closing:'thanks'}},
];
const SUITEBY=Object.fromEntries(SUITES.map(s=>[s.id,s]));
/* 版型 → 角色。分類只能猜到大方向（雜誌、地圖這些要逐一指名） */
const ROLE_BY_ID={thanks:'closing',mCover:'cover',mIndex:'toc',mFeature:'text',mColumns:'text',twMap:'data',
  cBig:'cover',cFrame:'cover',cMarker:'cover',cEcho:'cover',cLockup:'cover',cBand:'cover',ocean:'cover',duotone:'cover',
  kPortrait:'card',cutoutCard:'card',kPhoto:'card',kAnnounce:'card',kList:'card',kNumber:'card',kQuote:'card',petalFan:'card',
  split:'cover',wall:'wall',posterWall:'wall',nightWall:'wall',tQuote:'quote',tTable:'table'};
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
  return 'photo';
}
/* id 或中文名都認（命令列輸入「年度報告」也可以） */
const suiteFrom=v=>{v=String(v||'').trim();if(!v)return null;
  return SUITEBY[v]||SUITES.find(s=>s.name===v)||SUITES.find(s=>s.name.includes(v))||null};
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
  return n;
}
