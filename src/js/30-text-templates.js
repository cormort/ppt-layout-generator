/* ---------- 文字頁：不用圖片，文字多時自動縮字／分欄，放不下才截斷（會出現提醒） ---------- */
/* 共用標題列：長標題縮字，最多兩行；回傳內容區起點 y */
function head(c){
  const k=FS,x=W>H?120:80,w=W-2*x;let size=60;
  while(size>40&&wrap(c.t.title,w,size,c.tf,700).length>2)size-=4;
  const tl=wrap(c.t.title,w,size,c.tf,700).slice(0,2);
  let y=112+size*k*.85,s=`<rect x="${x}" y="70" width="80" height="8" rx="4" fill="${c.col.acc}"/>`;
  s+=T(tl,{x,y,size,lh:1.2,fill:c.col.ink,font:c.tf,weight:700});y+=(tl.length-1)*size*k*1.2;
  if(c.t.subtitle){const sl=wrap(c.t.subtitle,w,26,c.bf,500).slice(0,2);y+=26*k+22;s+=T(sl,{x,y,size:26,lh:1.45,fill:c.col.mt,font:c.bf,weight:500});y+=(sl.length-1)*26*k*1.45}
  y+=34;s+=`<rect x="${x}" y="${f1(y)}" width="${w}" height="2" fill="${c.col.dk?'rgba(255,255,255,.18)':c.col.light}"/>`;
  return{s,y:y+44};
}
const tPaper=c=>bg(c.col.paper||'#ffffff');
const tSoft=c=>c.col.dk?'rgba(255,255,255,.07)':c.col.light;
/* 文字頁支援所有尺寸：左右留白與內容區底線依目前的 W、H 計算 */
const TXR=['16:9','1:1','4:5','3:4','9:16'],TP=()=>W>H?120:80,TBOTTOM=()=>H-(W>H?80:90);

def({id:'tList',cat:'text',name:'文字・條列重點',hint:'不用圖片；項目填「重點|說明」，多項自動分兩欄並縮字',ratios:TXR,render(c){
  const h=head(c),it=items(c).slice(0,24),k=FS,nc=it.length>6&&W>H?2:1;let top=h.y;const cols=strip(TP(),W-TP(),nc,90),per=Math.ceil(it.length/nc);
  const lay=sz=>cols.map(([a,b],ci)=>{let y=0;const rows=it.slice(ci*per,ci*per+per).map((o,j)=>{const w=b-a-76,al=wrap(o.a,w,sz,c.tf,700),bl=wrap([o.b,o.c].filter(Boolean).join('　'),w,sz*.72,c.bf),r={n:ci*per+j,al,bl,y};
    y+=al.length*sz*k*1.32+(bl.length?bl.length*sz*.72*k*1.5+6:0)+sz*k*.75;return r});return{a,rows,h:y}});
  /* 項目少時字放大一點；放滿時從頂端排，有空時整組往中間移（略偏上，視覺比正中央穩） */
  let sz=it.length<=3?44:it.length<=5?40:36,L=lay(sz);while(sz>18&&Math.max(...L.map(l=>l.h))>TBOTTOM()-top){sz-=2;L=lay(sz)}
  top+=Math.max(0,(TBOTTOM()-top-Math.max(...L.map(l=>l.h)))*.3);
  const bs=Math.max(30,sz*1.05)*k;let s='';
  for(const col of L)for(const r of col.rows){const y0=top+r.y;if(y0+sz*k>TBOTTOM())break;
    const by=y0+sz*k*.95-bs*.72;
    s+=`<rect x="${col.a}" y="${f1(by)}" width="${f1(bs)}" height="${f1(bs)}" rx="${f1(bs*.25)}" fill="${c.col.main}"/>`+T([pad2(r.n)],{x:col.a+bs/2,y:by+bs*.68,size:f1(bs*.48),fill:'#fff',font:c.bf,weight:700,anchor:'middle',fixed:true})
     +T(r.al,{x:col.a+76,y:y0+sz*k*.95,size:sz,lh:1.32,fill:c.col.ink,font:c.tf,weight:700})
     +T(r.bl,{x:col.a+78,y:y0+r.al.length*sz*k*1.32+sz*.72*k*1.05,size:f1(sz*.72),lh:1.5,fill:c.col.mute,font:c.bf})}
  return tPaper(c)+h.s+s;
}});

def({id:'tGrid',cat:'text',name:'文字・重點方格',hint:'不用圖片；項目填「重點|說明」，2–12 格自動排列',ratios:TXR,render(c){
  /* 直式與方形最多兩欄 */
  const h=head(c),it=items(c).slice(0,12),n=it.length,k=FS,nc=W>H?(n<=3?n:n===4?2:n<=6?3:n===9?3:4):Math.min(2,n),nr=Math.ceil(n/nc),gap=28,cols=strip(TP(),W-TP(),nc,gap);
  let top=h.y,ch=(TBOTTOM()-top-(nr-1)*gap)/nr;
  const body=o=>[o.b,o.c].filter(Boolean).join('　');
  const need=sz=>Math.max(...it.map((o,i)=>{const w=cols[i%nc][1]-cols[i%nc][0]-64;return wrap(o.a,w,sz,c.tf,700).length*sz*k*1.3+wrap(body(o),w,sz*.62,c.bf).length*sz*.62*k*1.5+76}));
  let sz=40;while(sz>18&&need(sz)>ch)sz-=2;
  /* 字少時方格不必撐滿：高度跟著內容，整組垂直置中 */
  const fitH=Math.min(ch,Math.max(need(sz)+40,220)),used=nr*fitH+(nr-1)*gap;top+=(TBOTTOM()-top-used)/2;ch=fitH;
  let s='';
  it.forEach((o,i)=>{const[a,b]=cols[i%nc],y=top+Math.floor(i/nc)*(ch+gap),w=b-a-64,al=wrap(o.a,w,sz,c.tf,700),bl=wrap(body(o),w,sz*.62,c.bf);
    const maxA=Math.max(1,Math.floor((ch-70)/(sz*k*1.3))),aa=al.slice(0,maxA),maxB=Math.max(0,Math.floor((ch-76-aa.length*sz*k*1.3)/(sz*.62*k*1.5)));
    s+=`<rect x="${f1(a)}" y="${f1(y)}" width="${f1(b-a)}" height="${f1(ch)}" rx="18" fill="${tSoft(c)}"/><rect x="${f1(a)}" y="${f1(y+18)}" width="7" height="${f1(Math.max(0,ch-36))}" rx="3.5" fill="${c.col.main}"/>`
     +T([pad2(i)],{x:a+32,y:y+48,size:22,fill:c.col.acc,font:c.bf,weight:800,ls:2})
     +T(aa,{x:a+32,y:y+60+sz*k,size:sz,lh:1.3,fill:c.col.ink,font:c.tf,weight:700})
     +T(bl.slice(0,maxB),{x:a+32,y:y+60+aa.length*sz*k*1.3+sz*.62*k*1.2,size:f1(sz*.62),lh:1.5,fill:c.col.mute,font:c.bf})});
  return tPaper(c)+h.s+s;
}});

def({id:'tTable',cat:'text',name:'文字・表格',hint:'不用圖片；項目每行一列、用「|」分欄，第一行是表頭',ratios:TXR,render(c){
  const h=head(c),k=FS,x0=TP(),W0=W-2*TP(),top=h.y;
  let R=String(c.t.items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>s.split(/[|｜]/).map(v=>v.trim()));
  if(!R.length)R=[['項目','說明'],['範例','每行一列，用「|」分隔欄位']];R=R.slice(0,18);
  const nc=Math.max(...R.map(r=>r.length));
  /* 欄寬依各欄最長內容分配（單欄上限避免一欄吃掉全部） */
  const need=[...Array(nc)].map((_,j)=>Math.max(120,...R.map(r=>Math.min(820,tw(r[j]||'',24,c.bf)+40)))),tot=need.reduce((a,b)=>a+b,0),cw=need.map(v=>v/tot*W0);
  const wt=(i,j)=>i===0||j===0?700:400,fo=(i,j)=>i===0?c.tf:c.bf;
  const lay=sz=>R.map((r,i)=>cw.map((w,j)=>wrap(r[j]||'',w-36,sz,fo(i,j),wt(i,j))));
  const rh=(L,sz)=>L.map(cells=>Math.max(1,...cells.map(l=>l.length))*sz*k*1.4+sz*k*.95);
  let sz=28,L=lay(sz);while(sz>15&&rh(L,sz).reduce((a,b)=>a+b,0)>TBOTTOM()-top){sz-=1;L=lay(sz)}
  const hs=rh(L,sz);let s='',y=top;
  for(let i=0;i<R.length;i++){if(y+hs[i]>TBOTTOM()+4)break;
    s+=`<rect x="${x0}" y="${f1(y)}" width="${W0}" height="${f1(hs[i])}" fill="${i===0?c.col.main:i%2===0?tSoft(c):'none'}"/>`;
    let x=x0;cw.forEach((w,j)=>{s+=T(L[i][j],{x:x+18,y:y+sz*k*.45+sz*k,size:sz,lh:1.4,fill:i===0?'#fff':c.col.ink,font:fo(i,j),weight:wt(i,j)});x+=w});
    y+=hs[i]}
  return tPaper(c)+h.s+s+`<rect x="${x0}" y="${f1(y)}" width="${W0}" height="3" fill="${c.col.main}"/>`;
}});

def({id:'tText',cat:'text',name:'文字・標題＋段落',hint:'不用圖片；內文多段自動縮字，項目接在內文後面當條列',ratios:TXR,render(c){
  const h=head(c),k=FS,top=h.y,P=TP(),w=W-2*P;
  const paras=[...String(c.t.body||'').split('\n').filter(s=>s.trim()).map(t=>({t,b:false})),
    ...String(c.t.items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(t=>({t:t.replace(/[|｜]/,'：').replace(/[|｜]/g,'　'),b:true}))];
  const lay=sz=>paras.map(p=>wrap(p.t,p.b?w-50:w,sz,c.bf));
  let sz=34,L=lay(sz);const hh=()=>L.reduce((a,l)=>a+l.length*sz*k*1.6+sz*k*.7,0);
  while(sz>18&&hh()>TBOTTOM()-top){sz-=1;L=lay(sz)}
  let s='',y=top+sz*k*.9;
  paras.forEach((p,i)=>{if(y>TBOTTOM())return;const ls=L[i].filter((_,j)=>y+j*sz*k*1.6<=TBOTTOM()+sz*k*.2);
    if(p.b)s+=`<circle cx="${P+14}" cy="${f1(y-sz*k*.33)}" r="${f1(sz*k*.17)}" fill="${c.col.main}"/>`;
    s+=T(ls,{x:p.b?P+50:P,y,size:sz,lh:1.6,fill:c.col.ink,font:c.bf});y+=L[i].length*sz*k*1.6+sz*k*.7});
  return tPaper(c)+h.s+s;
}});

def({id:'tQuote',cat:'text',name:'文字・引言金句',hint:'不用圖片；標題放金句，副標題放出處，內文放補充',ratios:TXR,render(c){
  /* 橫式：引號在左、文字在右；直式與方形：引號在上方，文字往下讓出空間 */
  const k=FS,wide=W>H,tx=wide?300:TP(),w=wide?1460:W-2*TP(),ml=wide?4:6;let sz=72;while(sz>40&&wrap(c.t.title,w,sz,c.tf,700).length>ml)sz-=4;
  const tl=wrap(c.t.title,w,sz,c.tf,700).slice(0,ml),sl=wrap(c.t.subtitle,w,30,c.bf,600).slice(0,2),bl=wrap(c.t.body,w,24,c.bf).slice(0,3);
  const th=(tl.length-1)*sz*k*1.35,tot=th+(sl.length?90+sl.length*42:0)+(bl.length?60+bl.length*38:0),y0=H/2+20-tot/2+(wide?0:60);
  /* 裝飾引號用路徑畫（不靠字型，沒有 Georgia 時也一樣大） */
  const qm=x=>`<circle cx="${x}" cy="${f1(y0-46)}" r="34"/><path d="M${x+34},${f1(y0-46)}C${x+34},${f1(y0+10)} ${x+6},${f1(y0+42)} ${x-30},${f1(y0+52)}L${x-34},${f1(y0+38)}C${x-8},${f1(y0+26)} ${x+6},${f1(y0+6)} ${x+4},${f1(y0-14)}Z"/>`;
  /* 路徑畫的是「”」形，轉 180° 成開引號「“」 */
  const qy=wide?y0-46:y0-sz*k-110,qx=wide?[140,226]:[tx+36,tx+122];
  return bg(c.col.paper||c.col.light)+`<g fill="${c.col.acc}" opacity=".5">${qx.map(x=>`<g transform="translate(0 ${f1(qy-(y0-46))}) rotate(180 ${x} ${f1(y0-46)})">${qm(x)}</g>`).join('')}</g>`
   +T(tl,{x:tx,y:y0,size:sz,lh:1.35,fill:c.col.ink,font:c.tf,weight:700})
   +(sl.length?`<rect x="${tx+2}" y="${f1(y0+th+48)}" width="90" height="6" rx="3" fill="${c.col.acc}"/>`+T(sl,{x:tx+2,y:y0+th+112,size:30,lh:1.4,fill:c.col.mt,font:c.bf,weight:600}):'')
   +T(bl,{x:tx+2,y:y0+th+(sl.length?112+sl.length*42+30:80),size:24,lh:1.6,fill:c.col.mute,font:c.bf});
}});

/* 數據並列：紙底上 2–4 個大數字，各自帶標籤與一行說明（不需要照片） */
def({id:'tStats',cat:'text',name:'文字・數據並列',hint:'不用圖片；項目填「數字|標籤|說明」，3–4 個並列最有力量',ratios:TXR,render(c){
  const h=hdr(c,{tMax:64}),k=FS,P=PAD(),it=items(c).slice(0,4),n=Math.max(1,it.length),wide=W>H;
  const nc=wide?n:Math.min(2,n),rows=Math.max(1,Math.ceil(n/nc)),gap=wide?(W>1600?72:46):34;
  const rowH=(H-h.y-P)/rows,colW=(W-2*P-(nc-1)*gap)/nc;
  let s=bg(c.col.paper||'#fff')+h.s;
  it.forEach((o,i)=>{
    const ci=i%nc,ri=Math.floor(i/nc),x=P+ci*(colW+gap),cellTop=h.y+ri*rowH;
    const num=o.a||'0',lab=o.b||'',note=o.c||'';
    let ns=Math.min(wide?160:126,Math.round(colW*.62));
    while(ns>44&&tw(num,ns*k,c.tf,800)>colW*.96)ns-=4;
    const labL=wrap(lab,colW,34,c.tf,700).slice(0,2),noteL=wrap(note,colW,22,c.bf).slice(0,2);
    const cellH=ns*k*1.05+28+6+34*k*1.3*labL.length+(noteL.length?18+noteL.length*22*k*1.5:0);
    const y0=cellTop+Math.max(0,(rowH-cellH)/2);
    s+=`<text x="${f1(x)}" y="${f1(y0+ns*k*.82)}" font-size="${f1(ns*k)}" font-family="${esc(c.tf)}" font-weight="800" fill="${c.col.main}" letter-spacing="-2">${esc(num)}</text>`
      +`<rect x="${f1(x)}" y="${f1(y0+ns*k*1.05+20)}" width="64" height="6" rx="3" fill="${c.col.acc}"/>`
      +T(labL,{x,y:y0+ns*k*1.05+64,size:34,lh:1.3,fill:c.col.ink,font:c.tf,weight:700});
    if(noteL.length)s+=T(noteL,{x,y:y0+ns*k*1.05+64+34*k*1.3*labL.length+16,size:22,lh:1.5,fill:c.col.mute,font:c.bf});
  });
  return s;
}});

