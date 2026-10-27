/* ---------- 文字封面：不用圖片，靠字級、字距、線條做出封面感；任何尺寸都能用 ---------- */
const coverBot=()=>H-Math.max(PAD(),footH()?footH()+26:0);
/* 標題取最大字級（行數 ≤ml、ok() 通過），再把行寬收窄到行數不變為止，讓各行等長、不會剩一個字孤零零在最後一行 */
function fitTitle(c,w,ts,ml,ok=()=>true){
  let tl;for(;;ts-=4){tl=wrap(c.t.title,w,ts,c.tf,800);if(ts<=44||(tl.length<=ml&&ok(tl,ts)))break}
  const n=tl.length;if(n>1)for(let ww=w*.98;ww>w*.3;ww-=w*.02){const t2=wrap(c.t.title,ww,ts,c.tf,800);if(t2.length>n)break;tl=t2}
  return{ts,tl:tl.slice(0,ml)};
}

/* 巨字排版：上方小標＋細槓，標題放到最大塞滿版寬，底部細線＋說明 */
def({id:'cBig',cat:'cover',name:'封面・巨字排版',hint:'不用圖片；標題放超大字，副標題是上方小標，內文放底部說明',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,w=W-2*P,bot=coverBot(),ml=wide?2:4;
  const sl=wrap(c.t.subtitle,w,28,c.bf,600).slice(0,2),bl=wrap(c.t.body,wide?w*.6:w,26,c.bf).slice(0,3);
  const ruleY=bl.length?bot-(bl.length-1)*26*k*1.6-26*k-34:bot,top=P+110+(sl.length-1)*28*k*1.4;
  /* 高度也要放得下：最後一行底在細線上方 56px，第一行頂不撞小標 */
  const{ts,tl}=fitTitle(c,w,wide?230:220,ml,(tl,ts)=>(tl.length-1)*ts*k*1.04+ts*k*.8<=ruleY-56-top);
  const y0=ruleY-56-(tl.length-1)*ts*k*1.04;
  let s=bg(c.col.paper||'#fff')+`<rect x="${P}" y="${P}" width="64" height="8" rx="4" fill="${c.col.acc}"/>`
   +T(sl,{x:P,y:P+64,size:28,lh:1.4,fill:c.col.mt,font:c.bf,weight:600,ls:6})
   +T(tl,{x:P-ts*.04,y:y0,size:ts,lh:1.04,fill:c.col.ink,font:c.tf,weight:800,ls:-2});
  if(bl.length)s+=`<rect x="${P}" y="${f1(ruleY)}" width="${w}" height="2" fill="${c.col.ink}" opacity=".22"/>`
   +T(bl,{x:P,y:ruleY+26*k+34,size:26,lh:1.6,fill:c.col.mute,font:c.bf});
  return s;
}});

/* 框線典雅：雙線框，置中排：小標 → 標題 → 菱形分隔 → 說明（頒獎、典禮、正式場合） */
def({id:'cFrame',cat:'cover',name:'封面・框線典雅',hint:'不用圖片；置中雙線框，適合典禮、頒獎、正式報告',ratios:ALLR,render(c){
  const k=FS,wide=W>H,m=wide?56:44,fb=footH()?footH()+8:m,cx=W/2,w=W-2*m-(wide?260:120),ml=wide?2:4;
  const{ts,tl}=fitTitle(c,w,wide?130:150,ml),sl=wrap(c.t.subtitle,w,26,c.bf,600).slice(0,2),bl=wrap(c.t.body,w*.86,26,c.bf).slice(0,wide?2:4);
  const sh=sl.length?(sl.length-1)*26*k*1.4+26*k+56:0,th=(tl.length-1)*ts*k*1.2,bh=bl.length?92+(bl.length-1)*26*k*1.6+26*k:60;
  const tot=sh+ts*k*.85+th+bh,y0=m+(H-m-fb-tot)/2,tY=y0+sh+ts*k*.85,oY=tY+th+52;
  const ink=c.col.ink,o=o=>`stroke="${ink}" stroke-opacity="${o}" fill="none"`;
  return bg(c.col.paper||c.col.light)
   +`<rect x="${m}" y="${m}" width="${W-2*m}" height="${H-m-fb}" ${o(.55)} stroke-width="3"/><rect x="${m+14}" y="${m+14}" width="${W-2*m-28}" height="${H-m-fb-28}" ${o(.3)} stroke-width="1.5"/>`
   +T(sl,{x:cx,y:y0+26*k,size:26,lh:1.4,fill:c.col.mt,font:c.bf,weight:600,ls:8,anchor:'middle'})
   +T(tl,{x:cx,y:tY,size:ts,lh:1.2,fill:ink,font:c.tf,weight:800,anchor:'middle',ls:4})
   +`<line x1="${f1(cx-150)}" y1="${f1(oY)}" x2="${f1(cx-22)}" y2="${f1(oY)}" ${o(.4)} stroke-width="2"/><line x1="${f1(cx+22)}" y1="${f1(oY)}" x2="${f1(cx+150)}" y2="${f1(oY)}" ${o(.4)} stroke-width="2"/>`
   +`<rect x="${f1(cx-9)}" y="${f1(oY-9)}" width="18" height="18" transform="rotate(45 ${f1(cx)} ${f1(oY)})" fill="${c.col.acc}"/>`
   +T(bl,{x:cx,y:oY+40+26*k,size:26,lh:1.6,fill:c.col.mute,font:c.bf,anchor:'middle'});
}});

/* 螢光標記：副標做成膠囊標籤，標題每行底下壓一條強調色螢光筆 */
def({id:'cMarker',cat:'cover',name:'封面・螢光標記',hint:'不用圖片；標題每行壓螢光筆底線，副標題變成標籤',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,w=wide?W*.72:W-2*P,ml=wide?3:4,bot=coverBot();
  const{ts,tl}=fitTitle(c,w,wide?150:160,ml),sub=String(c.t.subtitle||'').trim(),bl=wrap(c.t.body,wide?W*.5:w,26,c.bf).slice(0,3);
  const pill=sub?Math.min(W-2*P,tw(sub,26*k,c.bf,600)+[...sub].length*2+64):0,lh=ts*k*1.28;
  const tot=(sub?96:0)+ts*k*.85+(tl.length-1)*lh+(bl.length?70+(bl.length-1)*26*k*1.6+26*k:0);
  const y0=Math.max(P,Math.min(bot-tot,(H-tot)/2)),tY=y0+(sub?96:0)+ts*k*.85;
  let s=bg(c.col.paper||'#fff');
  if(sub)s+=`<rect x="${P}" y="${f1(y0)}" width="${f1(pill)}" height="${f1(26*k+30)}" rx="${f1((26*k+30)/2)}" fill="${c.col.main}"/>`
   +T([sub],{x:P+28,y:y0+26*k*.85+15,size:26,fill:'#fff',font:c.bf,weight:600,ls:2});
  s+=tl.map((l,i)=>`<rect x="${P-10}" y="${f1(tY+i*lh-ts*k*.34)}" width="${f1(tw(l,ts*k,c.tf,800)+20)}" height="${f1(ts*k*.4)}" rx="6" fill="${c.col.acc}" opacity=".42"/>`).join('')
   +T(tl,{x:P,y:tY,size:ts,lh:1.28,fill:c.col.ink,font:c.tf,weight:800})
   +T(bl,{x:P,y:tY+(tl.length-1)*lh+70+26*k,size:26,lh:1.6,fill:c.col.mute,font:c.bf});
  return s;
}});

/* 浮水印大字：主色底，副標（英文最好）放成超大空心字當背景，標題白字壓在左下 */
def({id:'cEcho',cat:'cover',name:'封面・浮水印大字',hint:'不用圖片；副標題（英文最好）放成背景空心大字，標題白字壓在上面',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,w=W-2*P,bot=coverBot(),wm=String(c.t.subtitle||c.t.title||'').trim().toUpperCase();
  /* 浮水印是裝飾：直接畫進底圖（不經 T，PPTX 不會變成文字框），超出右邊界沒關係 */
  const ws=Math.max(110,Math.min(wide?300:260,100*W*1.1/Math.max(1,tw(wm,100,'Arial Black,Arial',900))));
  const row=(y,dx)=>`<text x="${f1(-30+dx)}" y="${f1(y)}" font-size="${f1(ws)}" font-family="Arial Black,Arial" font-weight="900" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2.5">${esc(wm)}</text>`;
  const{ts,tl}=fitTitle(c,w,wide?140:170,wide?2:3),bl=wrap(c.t.body,wide?w*.62:w,26,c.bf).slice(0,3);
  const bY=bot-(bl.length?(bl.length-1)*26*k*1.6:0),ruleY=bl.length?bY-26*k-40:bot-6,tLast=ruleY-48;
  return bg(c.col.main)+(wm?row(P+ws*.8,0)+row(P+ws*1.75,-ws*.9):'')
   +T(tl,{x:P,y:tLast-(tl.length-1)*ts*k*1.14,size:ts,lh:1.14,fill:'#fff',font:c.tf,weight:800})
   +`<rect x="${P}" y="${f1(ruleY)}" width="86" height="6" rx="3" fill="${c.col.acc}"/>`
   +T(bl,{x:P,y:bY,size:26,lh:1.6,fill:'#fff',op:.85,font:c.bf});
}});
