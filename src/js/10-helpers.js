/* ---------- helpers ---------- */
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const unesc=s=>String(s).replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
const f1=n=>Math.round(n*10)/10;
const clampNum=(v,a,b,c)=>Number.isFinite(+v)?Math.min(b,Math.max(a,+v)):c;
const mctx=document.createElement('canvas').getContext('2d');
function tw(s,size,font,weight=400){mctx.font=`${weight} ${size}px ${font}`;return mctx.measureText(s).width}
/* 中文避頭尾：句號逗號等不可落在行首，開括號不可落在行尾 */
const NO_START='，。、；：？！）」』】》〉”’%…—·,.;:?!)]}>»';
const NO_END='（「『【《〈“‘([{<«';
const TOK=/[A-Za-z0-9À-ɏ'’\-.,:;!?()"&]+\s*|\s+|./gu;
/* FS：全域字級倍率（renderSVG 依 S.fs 設定）；COLLECT：PPTX 輸出時收集文字，改成可編輯文字框而不畫進圖 */
let FS=1,COLLECT=null;
function wrap(str,maxW,size,font,weight=400){
  size*=FS;
  const out=[];
  for(const para of String(str??'').split('\n')){
    if(!para.trim()){if(out.length)out.push('');continue}
    const raw=para.match(TOK)||[],toks=[];
    for(const t of raw){
      const last=toks.length?toks[toks.length-1]:null;
      if(last&&!/^\s+$/.test(last)&&NO_START.includes(t[0]))toks[toks.length-1]=last+t;
      else if(last&&NO_END.includes(last[last.length-1]))toks[toks.length-1]=last+t;
      else toks.push(t);
    }
    let line='';
    for(const t of toks){
      if(line&&tw((line+t).trimEnd(),size,font,weight)>maxW){out.push(line.trimEnd());line=t.trimStart()}
      else line+=t;
    }
    if(line.trim())out.push(line.trimEnd());
  }
  return out;
}
function T(lines,{x,y,size,lh=1.5,fill='#333',font,weight=400,anchor='start',ls=0,op=1,extra='',fixed=false}){
  if(!lines||!lines.length)return '';
  if(!fixed)size=f1(size*FS);
  if(COLLECT){if(lines.some(l=>String(l).trim()))COLLECT.push({lines:lines.map(String),x,y,size,lh,fill,font,weight,anchor,ls,op,shadow:/filter/.test(extra)});return ''}
  return `<text x="${f1(x)}" y="${f1(y)}" font-size="${size}" font-family="${esc(font)}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${ls}" opacity="${op}" ${extra}>`+
    lines.map((l,i)=>`<tspan x="${f1(x)}" dy="${i?f1(size*lh):0}">${esc(l)||' '}</tspan>`).join('')+`</text>`;
}
function VT(str,{x,y,size,gap=1.12,fill='#333',font,weight=400,op=1,extra=''}){
  const ch=[...String(str||'')];size=f1(size*FS);
  if(COLLECT){if(ch.length)COLLECT.push({vertical:true,lines:[ch.join('')],x,y,size,gap,fill,font,weight,op,shadow:/filter/.test(extra)});return ''}
  return `<text font-size="${size}" font-family="${esc(font)}" font-weight="${weight}" fill="${fill}" text-anchor="middle" opacity="${op}" ${extra}>`+
    ch.map((c,i)=>`<tspan x="${f1(x)}" y="${f1(y+i*size*gap)}">${esc(c)}</tspan>`).join('')+`</text>`;
}
/* 全域焦點 → 裁切中心點；個別圖片的 crop {z 放大倍率, fx/fy 主體中心 0–1} 會覆蓋它 */
const FOCAL_XY={Min:0,Mid:.5,Max:1};
const focalCrop=()=>({z:1,fx:FOCAL_XY[S.focal.slice(1,4)],fy:FOCAL_XY[S.focal.slice(5,8)]});
function IMG(im,x,y,w,h,a=''){
  const iw=im.w,ih=im.h;
  /* 混色與不透明度：掛在同一個元素上，轉點陣（PNG／PPTX／PDF）時一樣生效 */
  const fx=[];
  if(im.blend)fx.push('mix-blend-mode:'+im.blend);
  if(typeof im.op==='number'&&im.op<1)fx.push('opacity:'+f1(Math.max(.05,im.op)));
  const fxa=fx.length?`style="${fx.join(';')}"`:'';
  if(!iw||!ih||w<=0||h<=0)return `<image href="${im.src}" x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" preserveAspectRatio="${S.focal} slice" ${a} ${fxa}/>`;
  /* 去背後的圖：完整放進框內（不裁切、維持比例），主體才不會被切掉 */
  if(im.cutout){
    const sc=Math.min(w/iw,h/ih),dw=iw*sc,dh=ih*sc;
    return `<image href="${im.src}" x="${f1(x+(w-dw)/2)}" y="${f1(y+(h-dh)/2)}" width="${f1(dw)}" height="${f1(dh)}" preserveAspectRatio="xMidYMid meet" ${a} ${fxa}/>`;
  }
  /* 用巢狀 svg 的 viewBox 選出要顯示的那塊：先取符合框比例的最大範圍，再依倍率縮小、以主體點為中心 */
  const cr=im.crop||focalCrop(),A=w/h;let cw,ch;
  if(iw/ih>A){ch=ih;cw=ih*A}else{cw=iw;ch=iw/A}
  cw/=cr.z;ch/=cr.z;
  const cx=Math.min(iw-cw,Math.max(0,cr.fx*iw-cw/2)),cy=Math.min(ih-ch,Math.max(0,cr.fy*ih-ch/2));
  return `<g ${a} ${fxa}><svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="${f1(cx)} ${f1(cy)} ${f1(cw)} ${f1(ch)}" preserveAspectRatio="none"><image href="${im.src}" width="${iw}" height="${ih}"/></svg></g>`;
}
const bg=col=>`<rect width="${W}" height="${H}" fill="${col}"/>`;
const P=pts=>'M'+pts.map(p=>f1(p[0])+','+f1(p[1])).join('L')+'Z';
function bbox(pts){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const[x,y]of pts){a=Math.min(a,x);b=Math.min(b,y);c=Math.max(c,x);d=Math.max(d,y)}return[a,b,c-a,d-b]}
function unionB(sh){return bbox(sh.flatMap(s=>[[s.b[0],s.b[1]],[s.b[0]+s.b[2],s.b[1]+s.b[3]]]))}
function rot(pts,ang,tx,ty){const r=ang*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return pts.map(([x,y])=>[tx+x*c-y*s,ty+x*s+y*c])}
const HEXRE=/^#[0-9a-f]{6}$/i;
function hex2rgb(h){h=String(h||'').trim();if(!HEXRE.test(h)){if(/^#[0-9a-f]{3}$/i.test(h))h='#'+[...h.slice(1)].map(c=>c+c).join('');else return[47,93,138]}const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function mix(a,b,t){const A=hex2rgb(a),B=hex2rgb(b);return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const uniOf=c=>c.imgs.length===1||c.single;

/* shapes → clipped images. Shape: {el:'<path …/>', b:[x,y,w,h]} */
function mosaic(c,shapes,{shadow=true,box=null,attr=''}={}){
  let defs='',body='';
  if(uniOf(c)){
    const id=c.id();defs=`<clipPath id="${id}">${shapes.map(s=>s.el).join('')}</clipPath>`;
    const b=box||unionB(shapes);body=IMG(c.imgs[0],...b,`clip-path="url(#${id})"`);
  }else shapes.forEach((s,i)=>{const id=c.id();defs+=`<clipPath id="${id}">${s.el}</clipPath>`;body+=IMG(c.imgs[i%c.imgs.length],...s.b,`clip-path="url(#${id})"`)});
  return `<defs>${defs}</defs><g ${shadow?`filter="url(#${c.sh})"`:''} ${attr}>${body}</g>`;
}
/* left/centered text stack, vertically centred on cy */
function stack(c,{x,cy,w,anchor='start',tSize=84,tColor,sColor,bColor=c.col.mute,bSize=26,line=true,tWeight=700,sSize=30,maxBody=8}){
  let s='',y=0;const k=FS,c0=COLLECT?COLLECT.length:0,tl=wrap(c.t.title,w,tSize,c.tf,tWeight);
  s+=T(tl,{x,y,size:tSize,lh:1.18,fill:tColor,font:c.tf,weight:tWeight,anchor});y+=(tl.length-1)*tSize*k*1.18;
  if(c.t.subtitle){y+=sSize*k+26;const sl=wrap(c.t.subtitle,w,sSize,c.bf,600);s+=T(sl,{x,y,size:sSize,lh:1.3,fill:sColor,font:c.bf,weight:600,ls:2,anchor});y+=(sl.length-1)*sSize*k*1.3}
  if(line){y+=34;const lx=anchor==='middle'?x-40:anchor==='end'?x-80:x;s+=`<rect x="${lx}" y="${f1(y)}" width="80" height="5" rx="2.5" fill="${sColor}"/>`;y+=8}
  if(c.t.body){y+=bSize*k*1.9;const bl=wrap(c.t.body,w,bSize,c.bf).slice(0,maxBody);s+=T(bl,{x,y,size:bSize,lh:1.75,fill:bColor,font:c.bf,anchor});y+=(bl.length-1)*bSize*k*1.75}
  const top=-tSize*k*.85,bot=y+10,dy=cy-(top+bot)/2;
  /* PPTX 收集到的文字沒有經過下面的 translate，要自己補上位移 */
  if(COLLECT)for(let i=c0;i<COLLECT.length;i++)COLLECT[i].y+=dy;
  return `<g transform="translate(0 ${f1(cy-(top+bot)/2)})">${s}</g>`;
}
function items(c){const it=String(c.t.items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const[a,b='',...r]=s.split(/[|｜]/);return{a:a.trim(),b:b.trim(),c:r.join(' ').trim()}});return it.length?it:[{a:'項目一',b:'',c:''},{a:'項目二',b:'',c:''},{a:'項目三',b:'',c:''}]}
const nOf=(c,min=2,max=6,def=4)=>c.imgs.length>1&&!c.single?Math.max(min,Math.min(max,c.imgs.length)):def;
const pad2=i=>String(i+1).padStart(2,'0');
function strip(x0,x1,n,gap){const w=(x1-x0-(n-1)*gap)/n;return[...Array(n)].map((_,i)=>[x0+i*(w+gap),x0+i*(w+gap)+w])}
function band(xa,xb,top,bot,steps=18){const t=[],b=[];for(let k=0;k<=steps;k++){const x=xa+(xb-xa)*k/steps;t.push([x,top(x)]);b.unshift([x,bot(x)])}return t.concat(b)}
const polyShape=pts=>({el:`<path d="${P(pts)}"/>`,b:bbox(pts)});
function annular(cx,cy,R,r,a0,a1){const p=(rad,a)=>[cx+rad*Math.cos(a),cy+rad*Math.sin(a)],L=a1-a0>Math.PI?1:0;const[o0,o1,i1,i0]=[p(R,a0),p(R,a1),p(r,a1),p(r,a0)];
  const d=`M${f1(o0[0])},${f1(o0[1])}A${R},${R} 0 ${L} 1 ${f1(o1[0])},${f1(o1[1])}L${f1(i1[0])},${f1(i1[1])}A${r},${r} 0 ${L} 0 ${f1(i0[0])},${f1(i0[1])}Z`;
  const pts=[];for(let k=0;k<=8;k++){const a=a0+(a1-a0)*k/8;pts.push(p(R,a),p(r,a))}return{el:`<path d="${d}"/>`,b:bbox(pts)}}

