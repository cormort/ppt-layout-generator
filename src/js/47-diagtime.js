/* ---------- 斜切時間軸：照片斜切滿版，節點沿斜線往上排（16:9） ---------- */
/* 自適應字級：先看行數上限，再看最寬那一行 */
function fitW(str,maxW,maxSize,minSize,font,weight,maxLines=1){
  let s=maxSize,ls=wrap(str,maxW,maxSize,font,weight);
  while(s>minSize&&ls.length>maxLines){s-=2;ls=wrap(str,maxW,s,font,weight)}
  while(s>minSize&&tw(ls.reduce((a,b)=>a.length>=b.length?a:b,''),s,font,weight)>maxW){s-=2;ls=wrap(str,maxW,s,font,weight)}
  return{size:s,lines:ls};
}
def({id:'diagTime',cat:'biz',name:'商務・斜切時間軸',hint:'1 張滿版照片；項目填「年份|事件|說明」，節點沿斜線往上排（最多 5 個）',maxItems:5,render(c){
  const k=FS,pad=PAD(),it=items(c).slice(0,5),n=Math.max(1,Math.min(5,it.length)),paper=c.col.paper||'#ffffff';
  /* 照片：左上厚、右側薄，下緣是一條斜線（整頁的動線來源） */
  const px=W*.36,pbL=H*.46,pbR=H*.22,cid=c.id(),poly=P([[px,0],[W,0],[W,pbR],[px,pbL]]);
  let s=bg(paper)
   +`<defs><clipPath id="${cid}"><path d="${poly}"/></clipPath></defs>`
   +IMG(c.imgs[0],0,0,W,H,`clip-path="url(#${cid})"`)
   /* 照片下緣留一道白邊，像裁紙的刀口 */
   +`<path d="M${f1(px)},${f1(pbL)}L${W},${f1(pbR)}" stroke="${paper}" stroke-width="${f1(Math.max(10,H*.015))}"/>`;
  /* 節點線：跟照片下緣平行的斜線，左低右高；分欄等距，左到右就是時間順序 */
  const x0=W*.055,x1=W*.945,slot=(x1-x0)/n,boxW=Math.min(420,slot*.9),over=Math.min(slot*.34,240);
  const y0=H*.865,y1=y0-(x1-x0)*(pbL-pbR)/(W-px);
  const cx=i=>x0+slot*(i+.5),dyOf=x=>y0+(y1-y0)*(x-x0)/(x1-x0),
        photoBot=x=>x<=px?0:pbL+(pbR-pbL)*(x-px)/(W-px);
  s+=`<line x1="${f1(cx(0)-over)}" y1="${f1(dyOf(cx(0)-over))}" x2="${f1(cx(n-1)+over)}" y2="${f1(dyOf(cx(n-1)+over))}" stroke="${c.col.main}" stroke-opacity=".28" stroke-width="2"/>`;
  /* 每個節點：年份（大字）→ 事件名（膠囊）→ 說明；整塊貼在節點上方，靠斜線自然錯開 */
  for(let i=0;i<n;i++){
    const o=it[i]||{a:'',b:'',c:''},x=cx(i),dy=dyOf(x),bx=x-boxW/2;
    const room=Math.max(140,dy-44-photoBot(x)-24);
    const fy=fitW(o.a||'—',boxW,Math.min(46,Math.round(H*.045)),20,c.tf,800,1);
    /* 膠囊：先縮字級，還是放不下就折成兩行，不可以讓字跑出膠囊 */
    let ps=Math.min(20,Math.round(boxW*.058)+7),lab=o.b||'',pw=0;
    const pPad=s2=>Math.round(s2*k*1.5);
    for(;;){
      pw=tw(lab,ps*k,c.bf,700)*1.05+pPad(ps);
      if(pw<=boxW||ps<=13)break;
      ps-=1;
    }
    let plines=[lab],pH=Math.max(30,Math.round(ps*k*1.75));
    if(pw>boxW){
      plines=wrap(lab,boxW-pPad(ps),ps,c.bf,700).slice(0,2);
      pH=Math.max(30,Math.round(plines.length*ps*k*1.45+ps*k*.55));
      pw=Math.min(boxW,Math.max(...plines.map(l=>tw(l,ps*k,c.bf,700)))*1.05+pPad(ps));
    }
    let ns=Math.min(19,Math.round(boxW*.05)+7),nl=wrap(o.c||'',boxW,ns,c.bf).slice(0,5);
    const blockH=()=>fy.size*k*1.02+14+pH+16+nl.length*ns*k*1.6;
    while(ns>14&&blockH()>room){ns-=1;nl=wrap(o.c||'',boxW,ns,c.bf).slice(0,5)}
    const top=dy-40-Math.min(blockH(),room),pillY=top+fy.size*k*1.02+14;
    s+=`<line x1="${f1(x)}" y1="${f1(dy)}" x2="${f1(x)}" y2="${f1(pillY+pH+6)}" stroke="${c.col.main}" stroke-opacity=".45" stroke-width="2"/>`
     +`<circle cx="${f1(x)}" cy="${f1(dy)}" r="9" fill="${c.col.main}" stroke="${paper}" stroke-width="4"/>`
     +T(fy.lines,{x:bx,y:top+fy.size*k*.86,size:fy.size,fill:c.col.ink,font:c.tf,weight:800})
     +`<rect x="${f1(bx)}" y="${f1(pillY)}" width="${f1(pw)}" height="${f1(pH)}" rx="${f1(pH/2)}" fill="${c.col.main}"/>`
     +T(plines,{x:bx+pPad(ps)/2,y:pillY+pH/2+ps*k*.36-(plines.length-1)*ps*k*1.45/2,size:ps,lh:1.45,fill:'#fff',font:c.bf,weight:700});
    s+=T(nl,{x:bx,y:pillY+pH+16+ns*k*.86,size:ns,lh:1.6,fill:c.col.mute,font:c.bf});
  }
  /* 標題：照片左邊的白角落，字級自動收到 3 行以內 */
  const tw0=px-pad*1.35,lx=pad*.55;
  const ft=fitW(c.t.title||' ',tw0,Math.min(76,Math.round(H*.072)),30,c.tf,800,3);
  let ty=H*.28-((ft.lines.length-1)*ft.size*k*1.18)/2;
  s+=`<rect x="${f1(lx)}" y="${f1(ty-ft.size*k*1.35)}" width="72" height="7" rx="3.5" fill="${c.col.acc}"/>`
   +T(ft.lines,{x:lx,y:ty,size:ft.size,lh:1.18,fill:c.col.ink,font:c.tf,weight:800});
  ty+=(ft.lines.length-1)*ft.size*k*1.18+ft.size*k*.62;
  if(c.t.subtitle){const sl=wrap(c.t.subtitle,tw0,21,c.bf,600).slice(0,2);
    /* 字距會把行加寬，放不下就不要字距 */
    const sls=Math.max(...sl.map(l=>tw(l,21*k,c.bf,600)))+3*Math.max(...sl.map(l=>[...l].length))<=tw0?3:0;
    s+=T(sl,{x:lx+2,y:ty+20,size:21,lh:1.5,fill:c.col.mt,font:c.bf,weight:600,ls:sls});ty+=20+(sl.length-1)*21*k*1.5}
  if(c.t.body){const bl=wrap(c.t.body,tw0,18,c.bf).slice(0,3);
    s+=T(bl,{x:lx+2,y:ty+48,size:18,lh:1.7,fill:c.col.mute,font:c.bf})}
  return s;
}});
