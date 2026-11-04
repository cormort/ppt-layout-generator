/* ---------- 封面・下緣色帶：照片佔上方，下方整條色帶放標題（任何尺寸） ---------- */
def({id:'cBand',cat:'cover',name:'封面・下緣色帶',hint:'不用圖片也可以；照片在上、下方主色帶放標題，內文放色帶右側（或窄版面接在標題下）',ratios:ALLR,render(c){
  const k=FS,P=PAD(),wide=W>H,pad=P;
  const bandFill=c.col.dk?c.col.main:c.col.dark,ink='#ffffff';
  /* 標題先取能放進單行的最大字級；真的放不下才折兩行、色帶跟著長高 */
  const tw0=wide?W-2*pad-W*.24:W-2*pad;
  let ts=Math.min(wide?72:56,Math.round(H*.062)),tl=wrap(c.t.title||' ',tw0,ts,c.tf,800);
  while(ts>30&&tl.length>1){ts-=2;tl=wrap(c.t.title||' ',tw0,ts,c.tf,800)}
  const sub=c.t.subtitle?wrap(c.t.subtitle,tw0,Math.round(ts*.36),c.bf,600).slice(0,2):[];
  const bodyL=wide&&c.t.body?wrap(c.t.body,W*.22,18,c.bf).slice(0,3):[];
  const titleH=(tl.length-1)*ts*k*1.14+ts*k*.92;
  const subS=Math.round(ts*.36),subH=sub.length?sub.length*subS*k*1.5+24:0;
  /* 色帶高度：內容（小標＋標題）＋上下留白；色帶裡的東西垂直居中 */
  const narrowBody=!wide&&c.t.body?wrap(c.t.body,W-2*pad,20,c.bf).slice(0,2).length*34+40:0;
  const blockH=46+subH+titleH+narrowBody;
  const minBand=wide?H*.26:H*.30,bandH=Math.min(H*.46,Math.max(minBand,blockH+120));
  const bandTop=H-bandH,pad2=Math.max(34,(bandH-blockH)/2);
  const px=pad*.55;
  let s=bg(c.col.paper||'#ffffff');
  if(c.imgs[0])s+=IMG(c.imgs[0],0,0,W,bandTop);
  s+=`<rect x="0" y="${f1(bandTop)}" width="${W}" height="${f1(bandH)}" fill="${bandFill}"/>`
   +`<rect x="${f1(px)}" y="${f1(bandTop+pad2)}" width="72" height="5" rx="2.5" fill="${c.col.acc}"/>`;
  /* 小標 → 標題：小標 1–2 行的高度＋24px 間距，標題底線不要貼著小標 */
  let yTop=bandTop+pad2+46;
  if(sub.length){s+=T(sub,{x:px,y:yTop+subS*k*.85,size:subS,lh:1.5,fill:ink,op:.72,font:c.bf,weight:600,ls:5});yTop+=sub.length*subS*k*1.5+24}
  const yTitle=yTop+ts*k*.86;
  s+=T(tl,{x:px,y:yTitle,size:ts,lh:1.14,fill:ink,font:c.tf,weight:800,ls:1});
  if(bodyL.length){
    /* 色帶右側的說明：寬版面才有，窄版面接在標題下面 */
    const bx=W-pad*.55-W*.24;
    s+=`<rect x="${f1(bx-28)}" y="${f1(bandTop+bandH*.26)}" width="2" height="${f1(bandH*.42)}" fill="${ink}" opacity=".28"/>`
     +T(bodyL,{x:bx,y:bandTop+bandH*.26+18,size:18,lh:1.62,fill:ink,op:.78,font:c.bf});
  }else if(!wide&&c.t.body){
    s+=T(wrap(c.t.body,W-2*pad,20,c.bf).slice(0,2),{x:px,y:yTitle+titleH-ts*k*.92+44,size:20,lh:1.6,fill:ink,op:.78,font:c.bf});
  }
  return s;
}});

/* ---------- 封面・中央字標：滿版照片＋置中字標（任何尺寸） ---------- */
def({id:'cLockup',cat:'cover',name:'封面・中央字標',hint:'1 張照片；置中字標（小標→細線→大字→一句話），電影海報感',ratios:ALLR,render(c){
  const k=FS,wide=W>H,P=wide?W*.10:W*.08,w=W-2*P,cy=H*.5,ink='#ffffff';
  /* 標題取最大字級，最多三行 */
  let ts=Math.min(wide?150:118,Math.round(H*.135)),tl=wrap(c.t.title||' ',w,ts,c.tf,800);
  while(ts>36&&tl.length>3){ts-=4;tl=wrap(c.t.title||' ',w,ts,c.tf,800)}
  while(ts>36&&Math.max(...tl.map(l=>tw(l,ts*k,c.tf,800)))>w){ts-=4;tl=wrap(c.t.title||' ',w,ts,c.tf,800)}
  tl=tl.slice(0,3);
  const es=Math.min(30,Math.round(H*.026)),sub=c.t.subtitle?wrap(c.t.subtitle,w,es,c.bf,700).slice(0,2):[];
  const bs=Math.min(26,Math.round(H*.023)),bl=c.t.body?wrap(c.t.body,w*.86,bs,c.bf,500).slice(0,2):[];
  const subBlock=sub.length?es*k*1.7*sub.length+30:0;
  const titleBlock=(tl.length-1)*ts*k*1.12+ts*k;
  const bodyBlock=bl.length?40+bs*k*1.6*bl.length:0;
  const tot=subBlock+titleBlock+bodyBlock,top=cy-tot/2;
  const sg=c.id(),vg=c.id();
  let s=bg(c.col.dark||'#111');
  if(c.imgs[0])s+=IMG(c.imgs[0],0,0,W,H);
  /* 壓一層中央暗霧：任何照片上，白字都讀得出來（這是封面最常崩的地方） */
  s+=`<defs><radialGradient id="${sg}" gradientUnits="userSpaceOnUse" cx="${f1(W/2)}" cy="${f1(cy)}" r="${f1(Math.max(W,H)*.62)}"><stop offset="0" stop-color="#000" stop-opacity=".52"/><stop offset=".62" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>`
   +`<linearGradient id="${vg}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient></defs>`
   +`<rect width="${W}" height="${H}" fill="url(#${sg})"/><rect width="${W}" height="${H}" fill="url(#${vg})"/>`;
  if(sub.length)s+=T(sub,{x:W/2,y:top+es*k*.85,size:es,lh:1.7,fill:ink,op:.86,font:c.bf,weight:700,anchor:'middle',ls:9});
  const yT=top+subBlock+ts*k*.86;
  s+=`<rect x="${f1(W/2-36)}" y="${f1(yT-ts*k*1.04)}" width="72" height="3" rx="1.5" fill="${c.col.acc}"/>`
   +T(tl,{x:W/2,y:yT,size:ts,lh:1.12,fill:ink,font:c.tf,weight:800,anchor:'middle',ls:2});
  if(bl.length)s+=T(bl,{x:W/2,y:top+subBlock+titleBlock+40+bs*k*.2,size:bs,lh:1.6,fill:ink,op:.8,font:c.bf,weight:500,anchor:'middle',ls:2});
  return s;
}});
