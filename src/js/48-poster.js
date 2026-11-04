/* ---------- 海報拼貼：左側圓弧面板放主圖與標題，右側透視網格＋倒影（16:9） ---------- */
/* 單位方格 → 四邊形的投影：格子朝消失點收束，而不是被拉歪 */
function quadMap(p00,p10,p11,p01){
  const sx=p00[0]-p10[0]+p11[0]-p01[0],sy=p00[1]-p10[1]+p11[1]-p01[1];
  let a,b,d,e,gu=0,hv=0;
  if(Math.abs(sx)<1e-9&&Math.abs(sy)<1e-9){
    a=p10[0]-p00[0];b=p01[0]-p00[0];d=p10[1]-p00[1];e=p01[1]-p00[1];
  }else{
    const dx1=p10[0]-p11[0],dx2=p01[0]-p11[0],dy1=p10[1]-p11[1],dy2=p01[1]-p11[1];
    const det=(dx1*dy2-dx2*dy1)||1e-9;
    gu=(sx*dy2-dx2*sy)/det;hv=(dx1*sy-sx*dy1)/det;
    a=p10[0]-p00[0]+gu*p10[0];b=p01[0]-p00[0]+hv*p01[0];
    d=p10[1]-p00[1]+gu*p10[1];e=p01[1]-p00[1]+hv*p01[1];
  }
  const c0=p00[0],f0=p00[1];
  return(u,v)=>{const w=gu*u+hv*v+1;return[(a*u+b*v+c0)/w,(d*u+e*v+f0)/w]};
}
def({id:'posterWall',cat:'wall',name:'照片牆・曲面拼貼',hint:'第一張＝主圖（放左側圓弧面板、標題壓在上面），其餘輪流放右側透視網格＋倒影（16:9）',render(c){
  const k=FS,paper=c.col.paper||'#ffffff',cream=mix('#ffffff',c.col.acc,.42);
  const wall=mix(c.col.main,'#ffffff',.9);
  /* 右側：透視網格（左邊遠、右邊近），格子用 clipPath 切四邊形；圖片用 <use> 共用同一份 data URI */
  const TL=[W*.455,H*.275],TR=[W,H*.125],BR=[W,H*.72],BL=[W*.455,H*.632];
  const COLS=7,ROWS=5,GAP=.945,hm=quadMap(TL,TR,BR,BL);
  /* 裁切範圍：每格給不同的對焦點與倍率，重複用到同一張照片時也像不同畫面 */
  const cropVB=(im,bw,bh,fx,fy,z)=>{const iw=im.w||1,ih=im.h||1,A=bw/bh;let cw,ch;
    if(iw/ih>A){ch=ih;cw=ih*A}else{cw=iw;ch=iw/A}
    cw/=z;ch/=z;
    const cx=Math.min(iw-cw,Math.max(0,fx*iw-cw/2)),cy=Math.min(ih-ch,Math.max(0,fy*ih-ch/2));
    return`${f1(cx)} ${f1(cy)} ${f1(cw)} ${f1(ch)}`};
  /* 最多取 12 張：每張只內嵌一次（<use> 共用），檔案才不會變成十幾 MB */
  const pool=(c.imgs||[]).slice(0,12),ids=pool.map(()=>c.id());
  const imgDefs=pool.map((im,n)=>`<image id="${ids[n]}" href="${im.src}" width="${im.w||1}" height="${im.h||1}"/>`).join('');
  let cells='',cellDefs='';const rnd=rng(11);
  for(let r=0;r<ROWS&&pool.length;r++)for(let col=0;col<COLS;col++){
    const u0=col/COLS,u1=(col+1)/COLS,v0=r/ROWS,v1=(r+1)/ROWS;
    const q=[hm(u0,v0),hm(u1,v0),hm(u1,v1),hm(u0,v1)];
    const mx=(q[0][0]+q[1][0]+q[2][0]+q[3][0])/4,my=(q[0][1]+q[1][1]+q[2][1]+q[3][1])/4;
    const p=q.map(([x,y])=>[mx+(x-mx)*GAP,my+(y-my)*GAP]);
    const b=bbox(p),cid=c.id(),n=(r*COLS+col)%pool.length;
    const fx=.28+.44*rnd(),fy=.28+.44*rnd(),z=1+.18*rnd();
    cellDefs+=`<clipPath id="${cid}"><path d="${P(p)}"/></clipPath>`;
    cells+=`<g clip-path="url(#${cid})"><svg x="${f1(b[0])}" y="${f1(b[1])}" width="${f1(b[2])}" height="${f1(b[3])}" viewBox="${cropVB(pool[n],b[2],b[3],fx,fy,z)}" preserveAspectRatio="none"><use href="#${ids[n]}"/></svg></g>`;
  }
  /* 倒影：沿網格底邊鏡射，再用遮罩往上淡出（遮罩在鏡射前的座標系，方向才會對） */
  const deg=Math.atan2(BR[1]-BL[1],BR[0]-BL[0])*180/Math.PI;
  const mirror=`translate(${f1(BL[0])} ${f1(BL[1])}) rotate(${f1(deg)}) scale(1 -1) rotate(${f1(-deg)}) translate(${f1(-BL[0])} ${f1(-BL[1])})`;
  const fg=c.id(),fm=c.id();
  /* 遠端（左）加一層霧、牆腳加一道模糊的接觸陰影，平面的縱深才讀得出來 */
  const pg=c.id(),bl=c.id(),hg=c.id();
  const plane=P([TL,TR,BR,BL]);
  let s=bg(wall)
   +`<defs>${imgDefs}${cellDefs}<linearGradient id="${fg}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(H*.94)}" x2="0" y2="${f1(H*.56)}"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#000"/></linearGradient>`
   +`<mask id="${fm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${fg})"/></mask>`
   +`<clipPath id="${pg}"><path d="${plane}"/></clipPath><filter id="${bl}" x="-10%" y="-60%" width="120%" height="220%"><feGaussianBlur stdDeviation="${f1(H*.012)}"/></filter>`
   +`<linearGradient id="${hg}" gradientUnits="userSpaceOnUse" x1="${f1(TL[0])}" y1="0" x2="${f1(W*.78)}" y2="0"><stop offset="0" stop-color="${paper}" stop-opacity=".5"/><stop offset="1" stop-color="${paper}" stop-opacity="0"/></linearGradient></defs>`
   +`<g transform="${mirror}" opacity=".42"><g mask="url(#${fm})">${cells}</g></g>`
   +`<path d="M${f1(BL[0])},${f1(BL[1])}L${f1(BR[0])},${f1(BR[1])}" stroke="${c.col.dark}" stroke-opacity=".22" stroke-width="${f1(H*.03)}" filter="url(#${bl})"/>`
   +`<g filter="url(#${c.sh})">${cells}</g>`
   +`<g clip-path="url(#${pg})"><rect x="${f1(TL[0])}" y="0" width="${W}" height="${H}" fill="url(#${hg})"/></g>`;
  /* 左側圓弧面板：外弧是主色鑲邊、內弧放主圖；蓋在網格上，切出參考圖那種弧形分界 */
  const Cx=W*.13,Cy=H*.5,R=H*.70,R2=R-H*.045;
  const arcX=(r,y)=>Cx+Math.sqrt(Math.max(1,r*r-(y-Cy)*(y-Cy)));
  const panel=`M0,0L${f1(arcX(R,0))},0A${f1(R)},${f1(R)} 0 0 1 ${f1(arcX(R,H))},${H}L0,${H}Z`;
  const inner=`M0,0L${f1(arcX(R2,0))},0A${f1(R2)},${f1(R2)} 0 0 1 ${f1(arcX(R2,H))},${H}L0,${H}Z`;
  const pc=c.id(),ic=c.id(),vg=c.id(),xmax=arcX(R2,Cy);
  s+=`<defs><clipPath id="${pc}"><path d="${panel}"/></clipPath><clipPath id="${ic}"><path d="${inner}"/></clipPath>`
   +`<linearGradient id="${vg}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${f1(xmax*.85)}" y2="${f1(H*.62)}"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".5" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`
   +`<g filter="url(#${c.sh})"><path d="${panel}" fill="${c.col.main}"/>${c.imgs[0]?IMG(c.imgs[0],0,0,xmax,H,`clip-path="url(#${ic})"`):''}</g>`
   /* 主圖左上壓一層暗霧：奶油色標題在照片上才讀得出來 */
   +`<path d="${inner}" fill="url(#${vg})"/>`;
  /* 標題：面板左上，奶油色、字距放寬；字級自動收到 3 行以內 */
  const lx=W*.045,twmax=xmax*.82;
  let ts=Math.min(66,Math.round(H*.062)),tl=wrap(c.t.title||' ',twmax,ts,c.tf,800);
  const fits=()=>tl.length<=3&&Math.max(...tl.map(l=>tw(l,ts*k,c.tf,800)+2*[...l].length))<=twmax;
  while(ts>26&&!fits()){ts-=2;tl=wrap(c.t.title||' ',twmax,ts,c.tf,800)}
  const sub=c.t.subtitle?wrap(c.t.subtitle,twmax,19,c.bf,700).slice(0,2):[];
  const subH=sub.length*19*k*1.85,top=H*.095;
  let ty=top+subH+18+ts*k*.9;
  if(sub.length)s+=T(sub,{x:lx,y:top+19*k*.8,size:19,lh:1.85,fill:cream,op:.95,font:c.bf,weight:700,ls:6})
   +`<rect x="${f1(lx)}" y="${f1(top+subH+2)}" width="${f1(twmax*.32)}" height="3" rx="1.5" fill="${cream}" opacity=".8"/>`;
  s+=T(tl,{x:lx,y:ty,size:ts,lh:1.2,fill:cream,font:c.tf,weight:800,ls:2});
  if(c.t.body){const bl=wrap(c.t.body,twmax,17,c.bf).slice(0,3);
    s+=T(bl,{x:lx,y:ty+(tl.length-1)*ts*k*1.2+38,size:17,lh:1.7,fill:cream,op:.8,font:c.bf})}
  return s;
}});
