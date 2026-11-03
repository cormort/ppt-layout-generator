/* ---------- 花瓣扇：照片排成一朵花，標題在另一側（任何尺寸） ---------- */
/* 花瓣輪廓：尖端在原點、朝 +x 延伸，外端圓鈍。L＝花瓣長度、h＝半寬 */
function petalD(L,h){
  const q=n=>f1(n);
  return `M0,0Q${q(L*.14)},${q(-h*.66)} ${q(L*.4)},${q(-h)}C${q(L*.8)},${q(-h)} ${q(L)},${q(-h*.6)} ${q(L)},0`
   +`C${q(L)},${q(h*.6)} ${q(L*.8)},${q(h*.96)} ${q(L*.4)},${q(h*.96)}Q${q(L*.14)},${q(h*.66)} 0,0Z`;
}
/* 同一條輪廓的取樣點：算「旋轉後的花瓣範圍」用（照片要剛好蓋住整片花瓣） */
function petalPts(L,h,steps=9){
  const qb=(a,b,c2,t)=>{const u=1-t;return[u*u*a[0]+2*u*t*b[0]+t*t*c2[0],u*u*a[1]+2*u*t*b[1]+t*t*c2[1]]};
  const cb=(a,b,c2,d,t)=>{const u=1-t,uu=u*u,tt=t*t;
    return[uu*u*a[0]+3*uu*t*b[0]+3*u*tt*c2[0]+tt*t*d[0],uu*u*a[1]+3*uu*t*b[1]+3*u*tt*c2[1]+tt*t*d[1]]};
  /* 跟 petalD 用同一組控制點：尖端→(L*.4,-h)→(L,0)→(L*.4,h*.96)→尖端 */
  const o=[0,0],q1=[L*.14,-h*.66],q2=[L*.4,-h],c1=[L*.8,-h],c2=[L,-h*.6],c3=[L,0],
        c4=[L,h*.6],c5=[L*.8,h*.96],c6=[L*.4,h*.96],q3=[L*.14,h*.66],pts=[];
  for(let i=0;i<=steps;i++)pts.push(qb(o,q1,q2,i/steps));
  for(let i=0;i<=steps;i++)pts.push(cb(q2,c1,c2,c3,i/steps));
  for(let i=0;i<=steps;i++)pts.push(cb(c3,c4,c5,c6,i/steps));
  for(let i=0;i<=steps;i++)pts.push(qb(c6,q3,o,i/steps));
  return pts;
}
def({id:'petalFan',cat:'card',name:'花瓣扇・圖文',hint:'5–8 張（一片花瓣一張；只有 1 張時每片花瓣各裁一部分）；副標是扇頁上方的小字',ratios:ALLR,render(c){
  const k=FS,pad=PAD(),wide=W>H,paper=c.col.paper||'#ffffff',u=Math.min(W,H);
  /* 左側的斜切色塊：一大片主色，裡面再壓一條比較亮的斜帶（右邊留白給文字） */
  const ang=-34*Math.PI/180,dx=Math.cos(ang),dy=Math.sin(ang),nx=-dy,ny=dx,len=Math.max(W,H)*2.6;
  const rib=(off,wd)=>{const hw=wd/2;
    return P([[nx*off-nx*hw-dx*len,ny*off-ny*hw-dy*len],[nx*off-nx*hw+dx*len,ny*off-ny*hw+dy*len],
      [nx*off+nx*hw+dx*len,ny*off+ny*hw+dy*len],[nx*off+nx*hw-dx*len,ny*off+ny*hw-dy*len]])};
  const wedge=wide?P([[0,0],[W*.33,0],[W*.11,H],[0,H]]):P([[0,0],[W*.72,0],[0,H*.19]]),wc=c.id();
  let s=bg(paper)+`<defs><clipPath id="${wc}"><path d="${wedge}"/></clipPath></defs>`
   +`<path d="${wedge}" fill="${c.col.main}"/>`
   +`<g clip-path="url(#${wc})"><path d="${rib(u*.11,u*.22)}" fill="${mix(c.col.main,'#ffffff',.32)}"/></g>`;
  /* 花朵：花瓣尖端離花心 rs、長度 R；每片再依固定表微調長短，扇面才不會太機械 */
  const cx=wide?W*.29:W*.5,cy=wide?H*.49:H*.30;
  const R=wide?Math.min(H*.375,W*.215):Math.min(W*.34,H*.215),rs=R*.15;
  const n=Math.max(5,Math.min(8,c.imgs.length>1&&!c.single?c.imgs.length:7));
  const SC=[1,.75,.97,1.09,.79,.92,1.12,.85],A0=-70,LEAN=17;
  const ring=[];
  for(let i=0;i<n;i++){
    const a=(A0+i*360/n)*Math.PI/180,L=R*SC[i%SC.length],h=L*.32;
    const ax=cx+Math.cos(a)*rs,ay=cy+Math.sin(a)*rs,deg=a*180/Math.PI+LEAN;
    const d=petalD(L,h),pts=rot(petalPts(L,h),deg,ax,ay);
    ring.push({d,tr:`translate(${f1(ax)} ${f1(ay)}) rotate(${f1(deg)})`,b:bbox(pts)});
  }
  /* 一片一片畫：先白色花瓣墊底（厚描邊＝花瓣之間的留白），再放這片花瓣的照片；
     後面的花瓣自然壓在前一片的白邊上，留白才不會被蓋掉 */
  const gapW=Math.max(12,R*.1);
  ring.forEach((p,i)=>{
    const id=c.id(),im=c.imgs[i%c.imgs.length];
    s+=`<path d="${p.d}" transform="${p.tr}" fill="${paper}" stroke="${paper}" stroke-width="${f1(gapW)}" stroke-linejoin="round"/>`
     +`<defs><clipPath id="${id}"><path d="${p.d}" transform="${p.tr}"/></clipPath></defs>`
     +`<g filter="url(#${c.sh})">${IMG(im,...p.b,`clip-path="url(#${id})"`)}</g>`;
  });
  /* 文字欄：16:9 在花朵右邊、直式在花朵下面 */
  const tx=wide?W*.60:pad,tmax=wide?Math.max(240,W-tx-pad):W-2*pad;
  const flowerBot=cy+rs+R*1.12;
  let es=Math.round(Math.min(wide?46:36,u*.05)),esl=c.t.subtitle?wrap(c.t.subtitle,tmax,es,c.bf,700):[];
  while(es>20&&esl.length>2){es-=2;esl=c.t.subtitle?wrap(c.t.subtitle,tmax,es,c.bf,700):[]}
  /* 小字的字距（海報感）在放不下時自動收窄，不要讓它超出文字欄 */
  let els=6;
  const widest=()=>Math.max(...esl.map(l=>tw(l,es*k,c.bf,700)))+els*Math.max(...esl.map(l=>[...l].length));
  while(els>0&&esl.length&&widest()>tmax)els-=2;
  let ts=wide?Math.round(W*.08):Math.round(W*.1),tl=wrap(c.t.title,tmax,ts,c.tf,800);
  while(ts>26&&tl.length>(wide?3:4)){ts-=4;tl=wrap(c.t.title,tmax,ts,c.tf,800)}
  let bs=wide?28:Math.round(W*.03),bl=wrap(c.t.body,tmax,bs,c.bf);
  while(bs>18&&bl.length>(wide?3:4)){bs-=2;bl=wrap(c.t.body,tmax,bs,c.bf)}
  bl=bl.slice(0,wide?3:4);
  const eh=esl.length?es*k*1.25+34:0,th=(tl.length-1)*ts*k*1.16+ts*k,
        bh=bl.length?44+(bl.length-1)*bs*k*1.68+bs*k:0,tot=eh+th+bh;
  /* 直式的文字塊擺在花朵下面的剩餘空間中間；空間不夠時貼著下緣（不要頂到頁尾） */
  const bot=H-Math.max(pad,footH()?footH()+24:0),spaceTop=flowerBot+40;
  let y=wide?H*.52-tot/2:Math.min(spaceTop+Math.max(0,(bot-spaceTop-tot)/2),Math.max(spaceTop,bot-tot));
  if(esl.length){s+=T(esl,{x:tx,y:y+es*k*.86,size:es,lh:1.25,fill:c.col.ink,op:.92,font:c.bf,weight:700,ls:els});y+=eh}
  s+=T(tl,{x:tx,y:y+ts*k*.86,size:ts,lh:1.16,fill:c.col.ink,font:c.tf,weight:800});
  y+=th;
  if(bl.length)s+=T(bl,{x:tx,y:y+44+bs*k*.86,size:bs,lh:1.68,fill:c.col.mute,font:c.bf});
  /* 右上角的小記號：兩片主色花瓣（版面才不會空） */
  const ms=Math.min(u*.07,80),mx=W-pad*.9-ms*.62,my=Math.max(pad*.45,H*.055)+ms*.5;
  s+=`<path d="${petalD(ms,ms*.34)}" transform="translate(${f1(mx)} ${f1(my)}) rotate(-58)" fill="${c.col.main}"/>`
   +`<path d="${petalD(ms*.78,ms*.3)}" transform="translate(${f1(mx+ms*.62)} ${f1(my+ms*.34)}) rotate(22)" fill="${c.col.main}" opacity=".7"/>`;
  return s;
}});
