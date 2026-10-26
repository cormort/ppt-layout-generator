/* ---------- 版面尺寸：16:9 簡報、1:1／4:5／3:4／9:16 圖卡。圖表、圖卡與文字版型用 W、H 排版 ---------- */
const PAD=()=>W>H?120:80;
/* 頁尾（公司｜日期｜頁碼）會蓋在右下角；需要貼底排版的版型先問這個高度，避免文字被壓到 */
const footH=()=>S.footer&&[S.company,S.date,S.page].some(v=>String(v||'').trim())?100:0;
/* 撕紙邊：從 (x0,y0) 到 (x1,y1) 的鋸齒折線，固定種子讓每次重畫都一樣 */
function tearPts(x0,y0,x1,y1,n=26,amp=16,seed=7){
  const r=rng(seed),len=Math.hypot(x1-x0,y1-y0)||1,nx=-(y1-y0)/len,ny=(x1-x0)/len,pts=[];
  for(let i=0;i<=n;i++){const t=i/n,off=(i===0||i===n)?0:(r()-.5)*2*amp;
    pts.push([x0+(x1-x0)*t+nx*off,y0+(y1-y0)*t+ny*off])}
  return pts;
}
const TP2=pts=>pts.map(p=>f1(p[0])+','+f1(p[1])).join('L');
/* 依尺寸調整的標題列（圖表、圖卡共用） */
function hdr(c,{tMax=64}={}){
  const k=FS,x=PAD(),w=W-2*x,top=W>H?70:84;let size=tMax;
  while(size>36&&wrap(c.t.title,w,size,c.tf,700).length>2)size-=4;
  const tl=wrap(c.t.title,w,size,c.tf,700).slice(0,2);let y=top+42+size*k*.85;
  let s=`<rect x="${x}" y="${top}" width="80" height="8" rx="4" fill="${c.col.acc}"/>`+T(tl,{x,y,size,lh:1.2,fill:c.col.ink,font:c.tf,weight:700});
  y+=(tl.length-1)*size*k*1.2;
  if(c.t.subtitle){const sl=wrap(c.t.subtitle,w,26,c.bf,500).slice(0,2);y+=26*k+20;s+=T(sl,{x,y,size:26,lh:1.45,fill:c.col.mt,font:c.bf,weight:500});y+=(sl.length-1)*26*k*1.45}
  return{s,y:y+40};
}

