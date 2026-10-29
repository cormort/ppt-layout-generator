/* ---------- 地圖：台灣縣市統計標註（地圖在中、左右長出標註框＋指標線） ----------
   輪廓資料在 src/js/05-tw-map-data.js（由 scripts/gen-tw-map.mjs 產生，內政部縣市界線）。
   項目第一欄是縣市名，其餘各欄各是一行說明；列出來的縣市上色並長出標註框，其餘留暗色當底。 */
const TW_SAMPLE=[
  ['新北市','農糧：茶','畜牧：豬、畜禽舍'],
  ['苗栗縣','農糧：柑橘、食用玉米'],
  ['臺中市','農糧：蘋果、甜柿、梨、大豆'],
  ['雲林縣','農糧：大蒜、落花生、洋蔥'],
  ['花蓮縣','漁業：漁筏、定置網'],
  ['屏東縣','農糧：改良種芒果、荔枝'],
];
/* 「臺／台」互通、市縣後綴可省略；但新竹、嘉義同時有市與縣，省略後綴時不猜 */
const twNorm=s=>String(s||'').replace(/\s/g,'').replace(/臺/g,'台');
const TW_FULL=new Map(),TW_SHORT=new Map();
for(const [kind,list] of [['county',TW_MAP.counties],['island',TW_MAP.islands]]){
  for(const e of list){
    const o={...e,kind};TW_FULL.set(twNorm(e.n),o);
    const s=twNorm(e.n).replace(/[市縣]$/,'');
    const prev=TW_SHORT.get(s);
    if(prev)prev.ambiguous=true;else TW_SHORT.set(s,{entry:o,ambiguous:false});
  }
}
/* 俗稱與改制前的名字 */
const TW_ALIAS={桃園縣:'桃園市',馬祖:'連江縣'};
function twFind(raw){
  const s=twNorm(raw);
  if(TW_FULL.has(s))return TW_FULL.get(s);
  const a=TW_ALIAS[s];if(a)return TW_FULL.get(twNorm(a));
  const hit=TW_SHORT.get(s);
  return hit&&!hit.ambiguous?hit.entry:null;
}
const twRows=c=>String(c.t.items||'').split('\n').map(s=>s.trim()).filter(Boolean)
  .map(s=>s.split(/[|｜]/).map(v=>v.trim()))
  .map(([name='',...lines])=>{const e=twFind(name);return e?{e,raw:name,lines:lines.filter(Boolean)}:null})
  .filter(Boolean);

def({id:'twMap',cat:'map',name:'地圖・縣市統計標註',hint:'項目填「縣市|說明|說明」：地圖上標出這些縣市，左右長出標註框（最多 12 個；澎湖、金門、連江畫成小圖）',maxItems:12,ratios:['16:9'],render(c){
  const k=FS;
  /* 1. 要標註的縣市：沒有認得的縣市名時用示意資料，縮圖才看得出這是什麼版型 */
  let rows=twRows(c);
  const sample=!rows.length;
  if(sample)rows=TW_SAMPLE.map(([n,...lines])=>({e:twFind(n),lines}));
  const dropped=sample?0:Math.max(0,rows.length-12);rows=rows.slice(0,12);

  /* 2. 版面：左右各一欄標註框，中間放地圖；底部留一條給資料來源（內文） */
  const P=Math.round(Math.min(W,H)*0.055),bw=Math.round(W*0.26),gap=Math.round(W*0.024);
  const x0=P+bw+gap,x1=W-P-bw-gap,rx=W-P-bw,top=P,bottom=H-P-(c.t.body?36:0);
  const islands=rows.filter(r=>r.e.kind==='island');
  const strip=islands.length?Math.min(104,Math.round((bottom-top)*0.13)):0;
  const availH=bottom-top-(strip?strip+34:0);
  const sc=Math.min((x1-x0)/TW_MAP.w,availH/TW_MAP.h),mw=TW_MAP.w*sc,mh=TW_MAP.h*sc;
  const mx=(W-mw)/2,my=top+(availH-mh)/2;
  const px=(x,y)=>[mx+x*sc,my+y*sc];
  /* 離島小圖：在主圖正下方排一排，每個一張縮小輪廓＋名稱 */
  const slot=strip?Math.min(132,Math.round((W-2*P)/8)):0,isl=[];
  islands.forEach((r,i)=>{
    const e=r.e,cw=slot-16,ch=strip,si=Math.min((cw-14)/e.w,(ch-40)/e.h);
    const bx=mx+(mw-islands.length*slot)/2+i*slot;
    isl.push({r,e,si,bx,by:my+mh+30,cw,ch,cx:bx+cw/2,cy:my+mh+30+ch/2});
  });

  /* 3. 分左右：先依位置分，再把多的搬到另一邊（兩欄高度平均），最後依所在高度排序 */
  rows.forEach(r=>{
    r.pt=r.e.kind==='island'?[isl.find(x=>x.r===r).cx,isl.find(x=>x.r===r).cy]:px(r.e.a[0],r.e.a[1]);
    r.side=r.pt[0]<W/2?'L':'R';
  });
  const side=s=>rows.filter(r=>r.side===s);
  while(side('L').length&&side('R').length&&Math.abs(side('L').length-side('R').length)>1){
    const big=side('L').length>side('R').length?'L':'R',other=big==='L'?'R':'L';
    const pick=side(big).slice().sort((a,b)=>Math.abs(a.pt[0]-W/2)-Math.abs(b.pt[0]-W/2))[0];
    if(!pick)break;pick.side=other;
  }
  const col={L:side('L').sort((a,b)=>a.pt[1]-b.pt[1]),R:side('R').sort((a,b)=>a.pt[1]-b.pt[1])};

  /* 4. 標題區（右欄上方）：標題＋副標（副標可以放「累計 4 億…」這種大字） */
  const tSize=Math.min(52,Math.round(bw*0.11)),sSize=Math.min(38,Math.round(bw*0.078));
  const tl=wrap(c.t.title,bw,tSize,c.tf,700).slice(0,2),sl=c.t.subtitle?wrap(c.t.subtitle,bw,sSize,c.bf,800).slice(0,2):[];
  const titleH=tl.length*tSize*k*1.24+(sl.length?18+sl.length*sSize*k*1.4:0);

  /* 5. 標註框：字級從 26 往下縮，直到兩欄都排得下 */
  const pad=fs=>Math.round(fs*0.72),colTop={L:top,R:top+titleH+34},colBot=bottom;
  const plan=fs=>{
    const o={};
    for(const s of ['L','R']){
      const list=col[s].map(r=>{
        const w=bw-pad(fs)*2;
        const lines=r.lines.length?r.lines.map(t=>wrap(t,w,fs,c.bf)).flat():[[]];
        const n=Math.max(1,lines.length);
        const hh=Math.round(fs*1.92),bh=n*Math.round(fs*1.52)+Math.round(fs*0.86);
        return{r,pt:r.pt,lines,n,hh,bh,h:hh+3+bh};
      });
      const need=list.reduce((a,b)=>a+b.h,0)+Math.max(0,list.length-1)*Math.round(fs*0.62);
      o[s]={list,need,room:colBot-colTop[s]};
    }
    return o;
  };
  let fs=26,pl=plan(fs);
  while(fs>15&&(pl.L.need>pl.L.room||pl.R.need>pl.R.room)){fs--;pl=plan(fs)}

  /* 6. 逐欄定位：先放在縣市旁邊，再依序往下推、超出底部時整體往上收 */
  for(const s of ['L','R']){
    const {list}=pl[s],g=Math.round(fs*0.62),lo=colTop[s],hi=colBot;
    let y=lo;
    for(const b of list){
      const want=Math.min(Math.max(b.pt[1]-b.h/2,y),hi-b.h);
      b.y=Math.max(y,want);y=b.y+b.h+g;
    }
    for(let i=list.length-1;i>=0;i--){
      const lim=i===list.length-1?hi-list[i].h:list[i+1].y-list[i].h-g;
      if(list[i].y>lim)list[i].y=Math.max(lo,lim);
    }
    /* 極端情況（框比欄位還高）就從頂端排，寧可壓到底部也不要疊在一起 */
    let yy=lo;for(const b of list){if(b.y<yy)b.y=yy;yy=b.y+b.h+g}
  }

  /* 7. 畫：底圖 → 縣市 → 離島小圖 → 指標線 → 標註框 → 標題 → 資料來源 */
  const base=mix(c.col.main,'#16222e',.3),hi=mix(c.col.main,'#ffffff',.66);
  const marked=new Set(rows.filter(r=>r.e.kind==='county').map(r=>r.e.n)),sw1=(1.5/sc).toFixed(2),sw2=(2.4/sc).toFixed(2);
  let map=`<g transform="translate(${f1(mx)} ${f1(my)}) scale(${sc.toFixed(4)})">`
    +TW_MAP.counties.filter(e=>!marked.has(e.n)).map(e=>`<path d="${e.d}" fill="${base}" stroke="${c.col.paper||'#fff'}" stroke-width="${sw1}"/>`).join('')
    +TW_MAP.counties.filter(e=>marked.has(e.n)).map(e=>`<path d="${e.d}" fill="${hi}" stroke="${mix(c.col.main,'#ffffff',.35)}" stroke-width="${sw2}"/>`).join('')
    +'</g>';
  for(const o of isl){
    const on=!!o.r,pad2=7;
    map+=`<rect x="${f1(o.bx)}" y="${f1(o.by)}" width="${f1(o.cw)}" height="${o.ch}" rx="10" fill="${mix(c.col.paper||'#ffffff',c.col.main,.05)}" stroke="${mix(c.col.main,'#ffffff',.78)}" stroke-width="1.5"/>`
      +`<g transform="translate(${f1(o.bx+(o.cw-o.e.w*o.si)/2)} ${f1(o.by+pad2)}) scale(${o.si.toFixed(4)})"><path d="${o.e.d}" fill="${on?hi:base}" stroke="${mix(c.col.main,'#ffffff',.4)}" stroke-width="${(1.6/o.si).toFixed(2)}"/></g>`
      +T([o.e.n.replace(/[市縣]$/,'')],{x:o.cx,y:o.by+o.ch-8,size:15,fill:on?c.col.main:c.col.mute,font:c.bf,weight:700,anchor:'middle'});
  }
  /* 指標線：框的內側邊中點 → 縣市錨點；兩頭各留一點空隙 */
  let lead='';
  for(const s of ['L','R'])for(const b of pl[s].list){
    const bx=s==='L'?P+bw:rx,ey=b.y+b.h/2,ax=b.pt[0],ay=b.pt[1];
    const dx=ax-bx,dy=ay-ey,len=Math.hypot(dx,dy)||1,u=Math.min(14,len/2);
    lead+=`<line x1="${f1(bx+dx*u/len)}" y1="${f1(ey+dy*u/len)}" x2="${f1(ax-dx*u/len)}" y2="${f1(ay-dy*u/len)}" stroke="${mix(c.col.main,'#ffffff',.45)}" stroke-width="1.8" opacity=".9"/>`
      +`<circle cx="${f1(ax)}" cy="${f1(ay)}" r="3.6" fill="${c.col.main}"/>`;
  }
  /* 標註框：標題條（主色）＋白底說明，中間留 3px 讓它看起來是兩塊 */
  let boxes='';
  for(const s of ['L','R'])for(const b of pl[s].list){
    const x=s==='L'?P:rx,y=b.y,p=pad(fs);
    boxes+=`<rect x="${f1(x)}" y="${f1(y)}" width="${bw}" height="${b.hh}" fill="${c.col.main}"/>`
      +T([b.r.raw||b.r.e.n],{x:x+p,y:y+Math.round(fs*1.34),size:fs,fill:'#fff',font:c.tf,weight:700})
      +`<rect x="${f1(x)}" y="${f1(y+b.hh+3)}" width="${bw}" height="${f1(b.bh)}" fill="${c.col.paper||'#ffffff'}" stroke="${mix(c.col.main,'#ffffff',.62)}" stroke-width="1.5"/>`;
    let ly=y+b.hh+3+Math.round(fs*0.92)+Math.round(fs*0.78);
    for(const line of b.lines){boxes+=T([line],{x:x+p+2,y:ly,size:fs,fill:c.col.ink,font:c.bf});ly+=Math.round(fs*1.52)}
  }
  let head='';
  if(tl.length){
    let ty=top+Math.round(tSize*k*0.9);
    head+=T(tl,{x:rx,y:ty,size:tSize,lh:1.24,fill:c.col.ink,font:c.tf,weight:700});
    ty+=(tl.length-1)*tSize*k*1.24;
    if(sl.length)head+=T(sl,{x:rx,y:ty+18+Math.round(sSize*k*0.92),size:sSize,lh:1.4,fill:c.col.acc,font:c.bf,weight:800});
  }
  let note=c.t.body?`<rect x="${P}" y="${f1(bottom)}" width="${f1(W-2*P)}" height="2" fill="${c.col.light}"/>`
    +T(wrap(c.t.body,W-2*P,19,c.bf).slice(0,1),{x:P,y:bottom+26,size:19,fill:c.col.mute,font:c.bf}):'';
  /* 超過 12 個縣市時明講，不要讓多出來的項目默默消失 */
  if(dropped)note+=T([`另有 ${dropped} 個縣市未顯示（這個版型最多標 12 個）`],{x:W-P,y:bottom+26,size:19,fill:c.col.mute,font:c.bf,anchor:'end'});
  return bg(c.col.paper||'#ffffff')+map+lead+boxes+head+note;
}});
