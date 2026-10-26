/* ---------- 圖卡（1:1、4:5、9:16）：社群貼文、LINE 公告、活動海報 ---------- */
def({id:'kPhoto',cat:'card',name:'圖卡・照片公告',hint:'1 張照片滿版；副標當小標，標題、內文疊在下方',ratios:CARDR,render(c){
  const g=c.id(),P=PAD(),k=FS,foot=[c.t.company,c.t.date].filter(Boolean).join('　');
  let s=IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="${c.col.dark}" stop-opacity="0"/><stop offset=".95" stop-color="${c.col.dark}" stop-opacity=".94"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`;
  let y=H-P-(foot?60:0);
  const bl=wrap(c.t.body,W-2*P,30,c.bf).slice(0,4),tl=wrap(c.t.title,W-2*P,84,c.tf,800).slice(0,3);
  if(bl.length){const by=y-(bl.length-1)*30*k*1.6;s+=T(bl,{x:P,y:by,size:30,lh:1.6,fill:'#fff',op:.9,font:c.bf});y=by-30*k-34}
  const ty=y-(tl.length-1)*84*k*1.15;s+=T(tl,{x:P,y:ty,size:84,lh:1.15,fill:'#fff',font:c.tf,weight:800});
  if(c.t.subtitle)s+=T([c.t.subtitle],{x:P,y:ty-84*k-14,size:30,fill:c.col.acc,font:c.bf,weight:700,ls:3});
  if(foot)s+=`<rect x="${P}" y="${H-P-34}" width="60" height="4" fill="${c.col.acc}"/>`+T([foot],{x:P,y:H-P+6,size:26,fill:'#fff',op:.8,font:c.bf});
  return s;
}});

def({id:'kAnnounce',cat:'card',name:'圖卡・活動公告',hint:'上方色塊放標題；項目填「時間｜10/22 14:00」這類資訊',ratios:CARDR,render(c){
  const P=PAD(),k=FS,bh=H*(H>W*1.4?.3:.36),it=items(c).slice(0,6),foot=[c.t.company,c.t.date].filter(Boolean).join('　');
  let s=bg(c.col.paper||'#ffffff')+`<rect width="${W}" height="${f1(bh)}" fill="${c.col.main}"/>`;
  const tl=wrap(c.t.title,W-2*P,80,c.tf,800).slice(0,3),ty=bh-P*.7-(tl.length-1)*80*k*1.15;
  if(c.t.subtitle)s+=T([c.t.subtitle],{x:P,y:ty-80*k-16,size:28,fill:'#fff',op:.85,font:c.bf,weight:700,ls:3});
  s+=T(tl,{x:P,y:ty,size:80,lh:1.15,fill:'#fff',font:c.tf,weight:800});
  let y=bh+P*.9;const lab=Math.max(...it.map(o=>tw(o.a,32*k,c.tf,700)))+40;
  for(const o of it){const bl=wrap(o.b||'',W-2*P-lab-24,32,c.bf).slice(0,2);
    s+=`<rect x="${P}" y="${f1(y-26)}" width="8" height="34" rx="4" fill="${c.col.acc}"/>`+T([o.a],{x:P+26,y,size:32,fill:c.col.ink,font:c.tf,weight:700})+T(bl,{x:P+26+lab,y,size:32,lh:1.35,fill:c.col.ink,font:c.bf});
    y+=Math.max(1,bl.length)*32*k*1.35+30}
  const bd=wrap(c.t.body,W-2*P,28,c.bf);const room=Math.floor((H-P-(foot?80:0)-y)/(28*k*1.7));
  if(bd.length&&room>0)s+=T(bd.slice(0,room),{x:P,y:y+20,size:28,lh:1.7,fill:c.col.mute,font:c.bf});
  if(foot)s+=`<line x1="${P}" y1="${H-P-40}" x2="${W-P}" y2="${H-P-40}" stroke="${c.col.light}" stroke-width="2"/>`+T([foot],{x:P,y:H-P+4,size:26,fill:c.col.mute,font:c.bf,weight:600});
  return s;
}});

def({id:'kList',cat:'card',name:'圖卡・重點清單',hint:'3–6 個重點；項目填「重點｜說明」，自動縮字',ratios:CARDR,render(c){
  const h=hdr(c,{tMax:72}),it=items(c).slice(0,8),k=FS,P=PAD(),top=h.y,bot=H-P;
  const lay=sz=>{let y=0;return it.map((o,i)=>{const al=wrap(o.a,W-2*P-90,sz,c.tf,700),bl=wrap(o.b,W-2*P-90,sz*.72,c.bf),r={i,al,bl,y};y+=al.length*sz*k*1.3+(bl.length?bl.length*sz*.72*k*1.5+6:0)+sz*k*.9;r.end=y;return r})};
  let sz=52,L=lay(sz);while(sz>24&&L.length&&L[L.length-1].end>bot-top){sz-=2;L=lay(sz)}
  const off=Math.max(0,(bot-top-(L.length?L[L.length-1].end:0))*.35);let s=bg(c.col.paper||c.col.light)+h.s;
  for(const r of L){const y0=top+off+r.y;if(y0+sz*k>bot)break;
    s+=`<circle cx="${P+28}" cy="${f1(y0+sz*k*.6)}" r="28" fill="${c.col.main}"/>`+T([String(r.i+1)],{x:P+28,y:y0+sz*k*.6+11,size:30,fill:'#fff',font:c.bf,weight:800,anchor:'middle',fixed:true})
     +T(r.al,{x:P+90,y:y0+sz*k*.95,size:sz,lh:1.3,fill:c.col.ink,font:c.tf,weight:700})
     +T(r.bl,{x:P+92,y:y0+r.al.length*sz*k*1.3+sz*.72*k*1.05,size:f1(sz*.72),lh:1.5,fill:c.col.mute,font:c.bf})}
  return s;
}});

def({id:'kNumber',cat:'card',name:'圖卡・數據亮點',hint:'大數字填「大數字」欄（例如 85%），標題是說明',maxItems:1,ratios:CARDR,render(c){
  const P=PAD(),k=FS,num=c.t.number||items(c)[0].a||'85%',w=W-2*P;
  let ns=Math.min(H*.3,360);while(ns>80&&tw(num,ns*k,c.tf,800)>w)ns-=10;
  const tl=wrap(c.t.title,w,64,c.tf,700).slice(0,3),bl=wrap(c.t.body,w,30,c.bf).slice(0,4);
  const tot=ns*k+40+tl.length*64*k*1.2+(bl.length?40+bl.length*30*k*1.6:0),y0=(H-tot)/2+ns*k*.8;
  let s=bg(c.col.paper||'#ffffff')+`<rect x="0" y="0" width="${W}" height="18" fill="${c.col.main}"/>`;
  if(c.t.subtitle)s+=T([c.t.subtitle],{x:W/2,y:y0-ns*k*.85-30,size:30,fill:c.col.mt,font:c.bf,weight:700,anchor:'middle',ls:3});
  s+=T([num],{x:W/2,y:y0,size:ns,fill:c.col.acc,font:c.tf,weight:800,anchor:'middle'});
  s+=`<rect x="${W/2-50}" y="${f1(y0+30)}" width="100" height="6" rx="3" fill="${c.col.main}"/>`+T(tl,{x:W/2,y:y0+40+64*k,size:64,lh:1.2,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'});
  s+=T(bl,{x:W/2,y:y0+40+tl.length*64*k*1.2+50,size:30,lh:1.6,fill:c.col.mute,font:c.bf,anchor:'middle'});
  return s;
}});

def({id:'kQuote',cat:'card',name:'圖卡・金句',hint:'標題放金句，副標題放出處',ratios:CARDR,render(c){
  const P=PAD(),k=FS,w=W-2*P;let sz=80;while(sz>44&&wrap(c.t.title,w,sz,c.tf,700).length>(H>W?7:5))sz-=4;
  const tl=wrap(c.t.title,w,sz,c.tf,700).slice(0,H>W?8:6),th=(tl.length-1)*sz*k*1.4,y0=H/2-th/2-20;
  const qm=x=>`<g transform="rotate(180 ${x} ${f1(y0-sz*k-60)})"><circle cx="${x}" cy="${f1(y0-sz*k-60)}" r="30"/><path d="M${x+30},${f1(y0-sz*k-60)}C${x+30},${f1(y0-sz*k-10)} ${x+6},${f1(y0-sz*k+18)} ${x-26},${f1(y0-sz*k+26)}L${x-30},${f1(y0-sz*k+14)}C${x-8},${f1(y0-sz*k+4)} ${x+6},${f1(y0-sz*k-14)} ${x+4},${f1(y0-sz*k-32)}Z"/></g>`;
  let s=bg(c.col.paper||c.col.light)+`<g fill="${c.col.acc}" opacity=".6">${qm(P+30)+qm(P+106)}</g>`;
  s+=T(tl,{x:P,y:y0,size:sz,lh:1.4,fill:c.col.ink,font:c.tf,weight:700});
  if(c.t.subtitle)s+=`<rect x="${P}" y="${f1(y0+th+50)}" width="80" height="6" rx="3" fill="${c.col.acc}"/>`+T([c.t.subtitle],{x:P,y:y0+th+110,size:32,fill:c.col.mt,font:c.bf,weight:600});
  return s;
}});

