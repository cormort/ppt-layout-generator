/* ---------- business templates ---------- */
def({id:'split',cat:'biz',name:'商務・封面左右分割',hint:'1 張；可填公司名、日期',render(c){
  const L=960;
  return bg(c.col.dark)+IMG(c.imgs[0],L,0,W-L,H)+`<rect x="${L-7}" width="14" height="${H}" fill="${c.col.acc}"/>`
   +T([c.t.company],{x:140,y:150,size:24,fill:c.col.acc,font:c.bf,weight:700,ls:6})
   +stack(c,{x:140,cy:520,w:700,tSize:92,tColor:'#fff',sColor:c.col.acc,bColor:'rgba(255,255,255,.82)',bSize:26,maxBody:5})
   +T([c.t.date],{x:140,y:980,size:24,fill:'#fff',op:.7,font:c.bf,ls:2});
}});

def({id:'bullets',cat:'biz',name:'商務・左圖右文條列',hint:'1 張；項目填「重點|說明」',render(c){
  const it=items(c).slice(0,6),n=it.length,cl=c.id(),x0=980,st=Math.min(150,620/n),y0=380+(620-st*n)/2;let rows='';
  it.forEach((o,i)=>{const y=y0+i*st;rows+=`<rect x="${x0}" y="${f1(y-40)}" width="56" height="56" rx="12" fill="${c.col.main}"/>`
    +T([pad2(i)],{x:x0+28,y:y-2,size:26,fill:'#fff',font:c.bf,weight:700,anchor:'middle'})
    +T([o.a],{x:x0+84,y,size:36,fill:c.col.ink,font:c.tf,weight:700})
    +T(wrap(o.b,780,22,c.bf).slice(0,st>=130?2:1),{x:x0+86,y:y+38,size:22,lh:1.5,fill:c.col.mute,font:c.bf})});
  const img=[[0,0],[860,0],[760,1080],[0,1080]];
  return bg(c.col.paper||'#fff')+`<defs><clipPath id="${cl}"><path d="${P(img)}"/></clipPath></defs>`+IMG(c.imgs[0],0,0,900,H,`clip-path="url(#${cl})"`)
   +`<path d="${P([[860,0],[892,0],[792,1080],[760,1080]])}" fill="${c.col.acc}"/>`
   +T([c.t.subtitle],{x:x0,y:150,size:24,fill:c.col.acc,font:c.bf,weight:700,ls:4})
   +T(wrap(c.t.title,820,62,c.tf,700).slice(0,1),{x:x0,y:228,size:62,fill:c.col.ink,font:c.tf,weight:700})
   +`<rect x="${x0}" y="262" width="820" height="2" fill="${c.col.light}"/><rect x="${x0}" y="261" width="90" height="4" fill="${c.col.main}"/>`+rows;
}});

def({id:'kpi',cat:'biz',name:'商務・數據亮點',hint:'1 張背景；項目填「數字|標籤|說明」',render(c){
  const it=items(c).slice(0,4),n=it.length,cols=strip(140,1780,n,60),g=c.id();let s='';
  cols.forEach(([a,b],i)=>{const o=it[i],w=b-a,sz=Math.min(140,100*(w-20)/Math.max(1,tw(o.a,100,c.tf,800)));
    if(i)s+=`<line x1="${f1(a-30)}" y1="560" x2="${f1(a-30)}" y2="930" stroke="#fff" stroke-opacity=".25"/>`;
    s+=T([o.a],{x:a,y:700,size:f1(sz),fill:c.col.acc,font:c.tf,weight:800,fixed:true})+`<rect x="${f1(a)}" y="735" width="60" height="4" fill="#fff" opacity=".7"/>`
     +T([o.b],{x:a,y:800,size:32,fill:'#fff',font:c.tf,weight:700})+T(wrap(o.c,w-20,21,c.bf).slice(0,3),{x:a,y:848,size:21,lh:1.55,fill:'#fff',op:.72,font:c.bf})});
  return IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.dark}" stop-opacity=".62"/><stop offset="1" stop-color="${c.col.dark}" stop-opacity=".93"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +T([c.t.title],{x:140,y:200,size:66,fill:'#fff',font:c.tf,weight:700})+T([c.t.subtitle],{x:142,y:262,size:26,fill:c.col.acc,font:c.bf,weight:700,ls:4})
   +T(wrap(c.t.body,1100,24,c.bf).slice(0,2),{x:142,y:330,size:24,lh:1.7,fill:'#fff',op:.8,font:c.bf})+s;
}});

def({id:'timeline',cat:'biz',name:'商務・時間軸',hint:'每節點 1 張；項目填「年份|事件|說明」',render(c){
  const it=items(c).slice(0,6),n=it.length,x0=240,x1=1680,ly=480,r=86,w=Math.min(300,(x1-x0)/Math.max(1,n-1)-24);let s='',defs='';
  s+=`<line x1="120" y1="${ly}" x2="1790" y2="${ly}" stroke="${c.col.soft}" stroke-width="6"/><path d="M1790,${ly-18}L1825,${ly}L1790,${ly+18}Z" fill="${c.col.soft}"/>`;
  it.forEach((o,i)=>{const x=n===1?960:x0+(x1-x0)*i/(n-1),id=c.id(),bl=wrap(o.b,w,28,c.tf,700).slice(0,2);
    defs+=`<clipPath id="${id}"><circle cx="${f1(x)}" cy="${ly}" r="${r}"/></clipPath>`;
    s+=`<circle cx="${f1(x)}" cy="${ly}" r="${r+12}" fill="#fff" stroke="${c.col.main}" stroke-width="4"/>`+IMG(c.imgs[i%c.imgs.length],x-r,ly-r,2*r,2*r,`clip-path="url(#${id})"`)
      +T([o.a],{x,y:ly+175,size:44,fill:c.col.mt,font:c.tf,weight:800,anchor:'middle'})
      +T(bl,{x,y:ly+228,size:28,lh:1.3,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})
      +T(wrap(o.c,w,20,c.bf).slice(0,4),{x,y:ly+228+bl.length*36+20,size:20,lh:1.5,fill:c.col.mute,font:c.bf,anchor:'middle'})});
  return bg(c.col.paper||'#fff')+`<rect y="${ly}" width="${W}" height="${H-ly}" fill="${c.col.paper?mix(c.col.paper,c.col.main,.15):c.col.light}" opacity=".6"/><defs>${defs}</defs>`
   +T([c.t.title],{x:960,y:160,size:64,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})
   +T([c.t.subtitle],{x:960,y:215,size:24,fill:c.col.mt,font:c.bf,weight:600,anchor:'middle',ls:5})+`<g filter="url(#${c.sh})">${s}</g>`;
}});

def({id:'steps',cat:'biz',name:'商務・流程步驟',hint:'每步 1 張（或 1 張連續）；項目填「步驟|說明」',render(c){
  const it=items(c).slice(0,6),n=it.length,y=320,h=290,d=60,gap=14,w=(1680-(n-1)*gap-d)/n,sh=[];let ov='',lab='';
  it.forEach((o,i)=>{const x=120+i*(w+gap),pts=[[x,y],[x+w,y],[x+w+d,y+h/2],[x+w,y+h],[x,y+h]];if(i)pts.push([x+d,y+h/2]);
    sh.push(polyShape(pts));const xc=x+w/2+d/2;
    ov+=`<path d="${P(pts)}" fill="${i%2?c.col.dark:c.col.main}" opacity=".38"/>`+T([pad2(i)],{x:xc,y:y+h/2+30,size:86,fill:'#fff',font:c.tf,weight:800,anchor:'middle',extra:`filter="url(#${c.ts})"`});
    lab+=T(wrap(o.a,w,34,c.tf,700).slice(0,1),{x:xc,y:710,size:34,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})+`<rect x="${f1(xc-22)}" y="735" width="44" height="4" rx="2" fill="${c.col.acc}"/>`
      +T(wrap(o.b,w-10,21,c.bf).slice(0,5),{x:xc,y:785,size:21,lh:1.55,fill:c.col.mute,font:c.bf,anchor:'middle'})});
  return bg(c.col.paper||'#fff')+mosaic(c,sh)+ov+lab+T([c.t.title],{x:960,y:170,size:64,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})
   +T([c.t.subtitle],{x:960,y:225,size:24,fill:c.col.mt,font:c.bf,weight:600,anchor:'middle',ls:5});
}});

def({id:'cards',cat:'biz',name:'商務・圖文卡片',hint:'每張卡片 1 張（2–4 欄）；項目填「標題|說明」',render(c){
  const it=items(c).slice(0,4),n=Math.max(2,it.length),cols=strip(140,1780,n,40),top=290,bot=960,ih=310,rr=20;let s='',defs='';
  cols.forEach(([a,b],i)=>{const o=it[i]||{a:'',b:''},w=b-a,id=c.id(),tl=wrap(o.a,w-72,36,c.tf,700).slice(0,2);
    defs+=`<clipPath id="${id}"><path d="M${f1(a)},${top+ih}V${top+rr}Q${f1(a)},${top} ${f1(a+rr)},${top}H${f1(b-rr)}Q${f1(b)},${top} ${f1(b)},${top+rr}V${top+ih}Z"/></clipPath>`;
    s+=`<rect x="${f1(a)}" y="${top}" width="${f1(w)}" height="${bot-top}" rx="${rr}" fill="#fff" filter="url(#${c.sh})"/>`+IMG(c.imgs[i%c.imgs.length],a,top,w,ih,`clip-path="url(#${id})"`)
     +`<rect x="${f1(a+36)}" y="${top+ih+40}" width="50" height="5" rx="2.5" fill="${c.col.acc}"/>`
     +T(tl,{x:a+36,y:top+ih+100,size:36,lh:1.25,fill:c.col.dark,font:c.tf,weight:700})
     +T(wrap(o.b,w-72,22,c.bf).slice(0,6-tl.length),{x:a+36,y:top+ih+100+tl.length*45+18,size:22,lh:1.6,fill:'#666',font:c.bf})});
  return bg(c.col.paper||c.col.light)+`<defs>${defs}</defs>`+T([c.t.title],{x:960,y:170,size:64,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})
   +T([c.t.subtitle],{x:960,y:225,size:24,fill:c.col.mt,font:c.bf,weight:600,anchor:'middle',ls:5})+s;
}});

