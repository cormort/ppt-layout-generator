/* ---------- 數據圖表：項目第一欄是類別，其餘欄是數值；第一列不是數字時當系列名稱 ---------- */
function numOf(s){
  s=String(s??'').trim();if(!s||/^[-−－—]$/.test(s))return null;
  const neg=/^\(.*\)$/.test(s)||/^[-−－]/.test(s),m=s.replace(/[,，\s]/g,'').match(/\d+(?:\.\d+)?/);
  if(!m)return null;const v=parseFloat(m[0]);return neg?-v:v;
}
function chartRows(items){return String(items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(l=>l.split(/[|｜]/).map(v=>v.trim()))}
/* 「數字表格」：至少 2 列資料、最多 5 欄，第一欄以外八成以上是數字（第一列可以是欄名） */
function isNumericTable(items){
  let rows=chartRows(items);if(rows.length&&rows[0].slice(1).every(v=>numOf(v)===null))rows=rows.slice(1);
  const cells=rows.flatMap(r=>r.slice(1));
  return rows.length>=2&&cells.length>0&&Math.max(...rows.map(r=>r.length))<=5&&cells.filter(v=>numOf(v)!==null).length/cells.length>=.8;
}
/* 依資料挑圖表：第一欄像時間（年、月、季）且資料多→折線；只有一組數值、每列都是正數且 ≤8 列→可用環圈，但預設仍給長條 */
function chartKind(items){
  let rows=chartRows(items);if(rows.length&&rows[0].slice(1).every(v=>numOf(v)===null))rows=rows.slice(1);
  const timeLike=rows.filter(r=>/(\d{2,4}\s*年|年度|^\d{2,4}$|月|Q[1-4]|季|週)/.test(r[0])).length>=rows.length*.7;
  if(timeLike&&rows.length>=5)return 'cLine';
  if(rows.some(r=>r[0].length>8)||rows.length>10)return 'cHbar';
  return 'cBar';
}
function chartData(c){
  let rows=chartRows(c.t.items);const isNum=r=>r.slice(1).some(v=>numOf(v)!==null);
  let head=null;if(rows.length>1&&!isNum(rows[0]))head=rows.shift();
  /* 沒有數字時用示意資料，版型縮圖才看得出是什麼圖 */
  const sample=!rows.some(isNum);if(sample){head=null;rows=[['第一季','32'],['第二季','45'],['第三季','38'],['第四季','56']]}
  const ns=Math.min(4,Math.max(1,...rows.map(r=>r.length-1)));
  return{sample,axis:head?head[0]:'',cats:rows.map(r=>r[0]),
    series:[...Array(ns)].map((_,j)=>({name:head?(head[j+1]||''):'',vals:rows.map(r=>numOf(r[j+1])),raw:rows.map(r=>r[j+1]||'')}))};
}
function niceScale(min,max,n=5){
  if(min===max)max=min+1;const s0=(max-min)/n,mag=10**Math.floor(Math.log10(s0)),f=s0/mag;
  const step=(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*mag,lo=Math.floor(min/step)*step,hi=Math.ceil(max/step)*step,ticks=[];
  for(let v=lo;v<=hi+step*1e-9;v+=step)ticks.push(+v.toFixed(10));return{lo,hi,ticks};
}
const fmtN=v=>Math.abs(v)>=1000?v.toLocaleString('en-US',{maximumFractionDigits:1}):String(+(+v).toFixed(2));
const serCol=(c,i)=>[c.col.main,c.col.acc,mix(c.col.main,'#ffffff',.45),mix(c.col.acc,'#000000',.3),mix(c.col.main,'#000000',.35),mix(c.col.acc,'#ffffff',.45),mix(c.col.main,c.col.acc,.5),'#9a9a96'][i%8];
/* 圖例、軸標題、註記（資料來源） */
function chartLegend(c,d,y){
  if(d.series.length<2)return'';let s='',x=PAD();const k=FS;
  d.series.forEach((se,i)=>{const n=se.name||'系列 '+(i+1);s+=`<rect x="${x}" y="${f1(y-18)}" width="22" height="22" rx="4" fill="${serCol(c,i)}"/>`+T([n],{x:x+32,y,size:22,fill:c.col.ink,font:c.bf});x+=32+tw(n,22*k,c.bf)+40});
  return s;
}
const chartNote=c=>c.t.body?T(wrap(c.t.body,W-2*PAD(),20,c.bf).slice(0,1),{x:PAD(),y:H-PAD()+(W>H?40:20),size:20,fill:c.col.mute,font:c.bf}):'';

def({id:'cBar',cat:'chart',name:'圖表・直條圖',hint:'貼上表格：第一欄類別、其餘欄數值（最多 4 組）',ratios:ALLR,render(c){
  const h=hdr(c),d=chartData(c),k=FS,P=PAD(),ns=d.series.length,nc=Math.max(1,d.cats.length);
  const x0=P+90,x1=W-P,y0=h.y+(ns>1?60:10),y1=H-P-80-(d.axis?34:0)-(c.t.body?10:0);
  const all=d.series.flatMap(s=>s.vals).filter(v=>v!==null),sc=niceScale(Math.min(0,...all),Math.max(0,...all));
  const Y=v=>y1-(v-sc.lo)/(sc.hi-sc.lo)*(y1-y0),yz=Y(Math.min(Math.max(0,sc.lo),sc.hi));
  let s=bg(c.col.paper||'#ffffff')+h.s+chartLegend(c,d,h.y+14);
  for(const t of sc.ticks){const y=Y(t);s+=`<line x1="${x0}" y1="${f1(y)}" x2="${x1}" y2="${f1(y)}" stroke="${t===0?c.col.ink:'#d9dce1'}" stroke-width="${t===0?2:1}"${t===0?'':' stroke-dasharray="4 6"'}/>`+T([fmtN(t)],{x:x0-14,y:y+7,size:20,fill:c.col.mute,font:c.bf,anchor:'end'})}
  const gw=(x1-x0)/nc,bw=Math.min(96,gw*.72/ns),ls=Math.max(16,Math.min(26,gw/4.2));
  d.cats.forEach((cat,ci)=>{const cx=x0+gw*(ci+.5);
    d.series.forEach((se,si)=>{const v=se.vals[ci];if(v===null)return;const bx=cx-bw*ns/2+si*bw,yv=Y(v);
      s+=`<rect x="${f1(bx+2)}" y="${f1(Math.min(yv,yz))}" width="${f1(Math.max(1,bw-4))}" height="${f1(Math.max(1,Math.abs(yz-yv)))}" rx="3" fill="${serCol(c,si)}"/>`;
      if(ns<=2&&nc<=12)s+=T([se.raw[ci]||fmtN(v)],{x:bx+bw/2,y:v>=0?yv-10:yv+ls+8,size:f1(ls*.9),fill:c.col.ink,font:c.bf,weight:700,anchor:'middle'})});
    s+=T(wrap(cat,gw-8,ls,c.bf).slice(0,2),{x:cx,y:y1+ls+12,size:ls,lh:1.2,fill:c.col.ink,font:c.bf,anchor:'middle'})});
  if(d.axis)s+=T([d.axis],{x:x1,y:y1+86,size:20,fill:c.col.mute,font:c.bf,anchor:'end'});
  return s+chartNote(c);
}});

def({id:'cHbar',cat:'chart',name:'圖表・橫條圖',hint:'類別名稱長或要排名時用；貼上表格（類別｜數值）',ratios:ALLR,render(c){
  const h=hdr(c),d=chartData(c),k=FS,P=PAD(),ns=d.series.length,nc=Math.max(1,d.cats.length);
  const y0=h.y+(ns>1?50:0),y1=H-P-(c.t.body?40:0),rh=(y1-y0)/nc,ls=Math.max(16,Math.min(28,rh*.32));
  const lw=Math.min(W*.36,Math.max(...d.cats.map(t=>tw(t,ls*k,c.bf)))+30),x0=P+lw,x1=W-P-130;
  const all=d.series.flatMap(s=>s.vals).filter(v=>v!==null),sc=niceScale(Math.min(0,...all),Math.max(0,...all));
  const X=v=>x0+(v-sc.lo)/(sc.hi-sc.lo)*(x1-x0),xz=X(Math.min(Math.max(0,sc.lo),sc.hi)),bh=Math.min(54,rh*.7/ns);
  let s=bg(c.col.paper||'#ffffff')+h.s+chartLegend(c,d,h.y+4);
  s+=`<line x1="${f1(xz)}" y1="${f1(y0)}" x2="${f1(xz)}" y2="${f1(y1)}" stroke="${c.col.ink}" stroke-width="2"/>`;
  if(d.axis)s+=T([d.axis],{x:x0-18,y:y0-10,size:20,fill:c.col.mute,font:c.bf,anchor:'end'});
  d.cats.forEach((cat,ci)=>{const cy=y0+rh*(ci+.5);
    s+=T(wrap(cat,lw-24,ls,c.bf).slice(0,1),{x:x0-18,y:cy+ls*.35,size:ls,fill:c.col.ink,font:c.bf,anchor:'end'});
    d.series.forEach((se,si)=>{const v=se.vals[ci];if(v===null)return;const by=cy-bh*ns/2+si*bh,xv=X(v);
      s+=`<rect x="${f1(Math.min(xv,xz))}" y="${f1(by+2)}" width="${f1(Math.max(1,Math.abs(xv-xz)))}" height="${f1(Math.max(1,bh-4))}" rx="3" fill="${serCol(c,si)}"/>`;
      s+=T([se.raw[ci]||fmtN(v)],{x:Math.max(xv,xz)+12,y:by+bh/2+ls*.32,size:f1(ls*.9),fill:c.col.ink,font:c.bf,weight:700})})});
  return s+chartNote(c);
}});

def({id:'cLine',cat:'chart',name:'圖表・折線圖',hint:'看趨勢（年度、月份）；貼上表格，可多條線',ratios:ALLR,render(c){
  const h=hdr(c),d=chartData(c),k=FS,P=PAD(),ns=d.series.length,nc=Math.max(1,d.cats.length);
  const x0=P+100,x1=W-P-(ns>1?40:20),y0=h.y+(ns>1?70:20),y1=H-P-70-(d.axis?34:0)-(c.t.body?10:0);
  const all=d.series.flatMap(s=>s.vals).filter(v=>v!==null),mn=Math.min(...all),mx=Math.max(...all);
  const sc=niceScale(mn>=0&&mn<mx*.5?0:mn,mx),Y=v=>y1-(v-sc.lo)/(sc.hi-sc.lo)*(y1-y0),X=i=>nc>1?x0+i*(x1-x0)/(nc-1):(x0+x1)/2;
  let s=bg(c.col.paper||'#ffffff')+h.s+chartLegend(c,d,h.y+14);
  for(const t of sc.ticks){const y=Y(t);s+=`<line x1="${x0}" y1="${f1(y)}" x2="${x1}" y2="${f1(y)}" stroke="#d9dce1" stroke-dasharray="4 6"/>`+T([fmtN(t)],{x:x0-16,y:y+7,size:20,fill:c.col.mute,font:c.bf,anchor:'end'})}
  const step=nc>12?Math.ceil(nc/12):1,ls=Math.max(16,Math.min(24,(x1-x0)/Math.min(nc,12)/4));
  d.cats.forEach((cat,i)=>{if(i%step)return;s+=T([cat],{x:X(i),y:y1+ls+16,size:ls,fill:c.col.ink,font:c.bf,anchor:'middle'})});
  d.series.forEach((se,si)=>{const col=serCol(c,si);let seg=[];const segs=[];
    se.vals.forEach((v,i)=>{if(v===null){if(seg.length)segs.push(seg);seg=[]}else seg.push([X(i),Y(v)])});if(seg.length)segs.push(seg);
    for(const g of segs)s+=`<polyline points="${g.map(p=>f1(p[0])+','+f1(p[1])).join(' ')}" fill="none" stroke="${col}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;
    se.vals.forEach((v,i)=>{if(v===null)return;s+=`<circle cx="${f1(X(i))}" cy="${f1(Y(v))}" r="8" fill="#fff" stroke="${col}" stroke-width="4"/>`;
      if((ns===1&&nc<=12)||i===se.vals.length-1)s+=T([se.raw[i]||fmtN(v)],{x:X(i),y:Y(v)-20,size:f1(ls*.95),fill:col,font:c.bf,weight:700,anchor:'middle'})})});
  if(d.axis)s+=T([d.axis],{x:x1,y:y1+80,size:20,fill:c.col.mute,font:c.bf,anchor:'end'});
  return s+chartNote(c);
}});

def({id:'cPie',cat:'chart',name:'圖表・環圈圖',hint:'看比例；貼上表格（類別｜數值），超過 8 項合併成「其他」',ratios:ALLR,render(c){
  const h=hdr(c),d=chartData(c),k=FS,P=PAD(),se=d.series[0];
  let sl=d.cats.map((cat,i)=>({cat,v:se.vals[i],raw:se.raw[i]})).filter(o=>o.v!==null&&o.v>0);
  if(sl.length>8){const rest=sl.slice(7).reduce((a,o)=>a+o.v,0);sl=[...sl.slice(0,7),{cat:'其他',v:rest,raw:fmtN(rest)}]}
  const tot=sl.reduce((a,o)=>a+o.v,0)||1,land=W>H,top=h.y,bot=H-P-(c.t.body?30:0);
  const R=land?Math.min((bot-top)/2,W*.2):Math.min(W/2-P,(bot-top)*.27),cx=land?P+R+20:W/2,cy=land?(top+bot)/2:top+R+10,r=R*.58;
  let s=bg(c.col.paper||'#ffffff')+h.s,a=-Math.PI/2;
  if(sl.length===1)s+=`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1((R+r)/2)}" fill="none" stroke="${serCol(c,0)}" stroke-width="${f1(R-r)}"/>`;
  else sl.forEach((o,i)=>{const b=a+o.v/tot*Math.PI*2;s+=annular(cx,cy,R,r,a,b).el.replace('<path ',`<path fill="${serCol(c,i)}" stroke="${c.col.paper||'#ffffff'}" stroke-width="4" `);a=b});
  s+=T([fmtN(tot)],{x:cx,y:cy+12,size:f1(Math.min(64,r*.5)),fill:c.col.ink,font:c.tf,weight:800,anchor:'middle'})+T([se.name||d.axis||'合計'],{x:cx,y:cy+r*.5,size:22,fill:c.col.mute,font:c.bf,anchor:'middle'});
  const lx=land?cx+R+90:P,ly0=land?cy-sl.length*30+20:cy+R+70,lh=land?Math.min(64,(bot-top)/Math.max(1,sl.length)):Math.min(60,(bot-ly0)/Math.max(1,sl.length)),lw=W-P-lx;
  if(d.axis)s+=T([d.axis],{x:lx,y:ly0-lh*.9,size:20,fill:c.col.mute,font:c.bf});
  sl.forEach((o,i)=>{const y=ly0+i*lh;
    s+=`<rect x="${f1(lx)}" y="${f1(y-20)}" width="24" height="24" rx="5" fill="${serCol(c,i)}"/>`+T(wrap(o.cat,lw*.55,26,c.bf).slice(0,1),{x:lx+38,y,size:26,fill:c.col.ink,font:c.bf})
     +T([Math.round(o.v/tot*1000)/10+'%'],{x:lx+lw,y,size:26,fill:c.col.ink,font:c.bf,weight:700,anchor:'end'})+T([o.raw||fmtN(o.v)],{x:lx+lw-120,y,size:22,fill:c.col.mute,font:c.bf,anchor:'end'})});
  return s+chartNote(c);
}});

