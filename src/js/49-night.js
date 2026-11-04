/* ---------- 夜空羽化：滿版星空底，截圖牆往四周融進黑暗，中央放一張主圖（16:9） ---------- */
def({id:'nightWall',cat:'wall',name:'照片牆・夜空羽化',hint:'第一張＝中央主圖，其餘輪流放進四周的截圖牆；標題是上方字標、內文是下方字幕（16:9）',render(c){
  const k=FS,base=mix(c.col.main,'#04060f',.86),paper='#ffffff';
  /* 星空底：固定種子的細星點，深底才不是一片死黑 */
  const rnd=rng(23);let stars='';
  for(let i=0;i<150;i++){const x=rnd()*W,y=rnd()*H,r=.5+rnd()*1.5;
    stars+=`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="#fff" opacity="${f1(.08+rnd()*.55)}"/>`}
  /* 截圖牆：7×4，四周用徑向遮罩羽化進夜色 */
  const GX=W*.03,GY=H*.065,GW=W*.94,GH=H*.70,COLS=7,ROWS=4,GAP=Math.round(W*.005);
  const cw=(GW-(COLS-1)*GAP)/COLS,ch=(GH-(ROWS-1)*GAP)/ROWS;
  const pool=(c.imgs||[]).slice(1,13),ids=pool.map(()=>c.id());
  const imgDefs=pool.map((im,n)=>`<image id="${ids[n]}" href="${im.src}" width="${im.w||1}" height="${im.h||1}"/>`).join('');
  const cropVB=(im,bw,bh,fx,fy,z)=>{const iw=im.w||1,ih=im.h||1,A=bw/bh;let cw2,ch2;
    if(iw/ih>A){ch2=ih;cw2=ih*A}else{cw2=iw;ch2=iw/A}
    cw2/=z;ch2/=z;
    const cx2=Math.min(iw-cw2,Math.max(0,fx*iw-cw2/2)),cy2=Math.min(ih-ch2,Math.max(0,fy*ih-ch2/2));
    return`${f1(cx2)} ${f1(cy2)} ${f1(cw2)} ${f1(ch2)}`};
  const rnd2=rng(41);let tiles='',tdefs='';
  for(let r=0;r<ROWS;r++)for(let col=0;col<COLS;col++){
    if(!pool.length)break;
    const x=GX+col*(cw+GAP),y=GY+r*(ch+GAP),n=(r*COLS+col)%pool.length;
    const fx=.3+.4*rnd2(),fy=.3+.4*rnd2(),z=1+.16*rnd2(),cid=c.id();
    tdefs+=`<clipPath id="${cid}"><rect x="${f1(x)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(ch)}" rx="3"/></clipPath>`;
    tiles+=`<g clip-path="url(#${cid})"><svg x="${f1(x)}" y="${f1(y)}" width="${f1(cw)}" height="${f1(ch)}" viewBox="${cropVB(pool[n],cw,ch,fx,fy,z)}" preserveAspectRatio="none"><use href="#${ids[n]}"/></svg></g>`;
  }
  const fg=c.id(),fm=c.id();
  /* 中央主圖：比格子大、跨 2×2，底下帶倒影；後面墊一圈暖光把主體從格子裡托出來 */
  const hw=Math.min(GW*.26,H*.46),hh=hw*1.04,hx=W/2-hw/2,hy=H*.47-hh*.5;
  const gw=c.id(),gr=c.id();
  let s=bg(base)+`<defs>${imgDefs}${tdefs}`
   /* 羽化：徑向遮罩，牆的中心保持全亮、四周約 4 成，最外圍幾乎融進夜色 */
   +`<radialGradient id="${fg}" gradientUnits="userSpaceOnUse" cx="${f1(W/2)}" cy="${f1(GY+GH*.46)}" r="${f1(W*.52)}"><stop offset=".34" stop-color="#fff"/><stop offset=".72" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#000"/></radialGradient>`
   +`<mask id="${fm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${fg})"/></mask>`
   +`<radialGradient id="${gw}" gradientUnits="userSpaceOnUse" cx="${f1(W/2)}" cy="${f1(hy+hh*.55)}" r="${f1(hw*.95)}"><stop offset="0" stop-color="${mix(c.col.acc,'#ffffff',.25)}" stop-opacity=".42"/><stop offset="1" stop-color="${mix(c.col.acc,'#ffffff',.25)}" stop-opacity="0"/></radialGradient>`
   +`<linearGradient id="${gr}" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(hy+hh)}" x2="0" y2="${f1(Math.min(H*.76,hy+hh*1.25))}"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
   +`<mask id="${gr}m" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#${gr})"/></mask></defs>`
   +stars
   +`<g mask="url(#${fm})">${tiles}</g>`
   +`<rect x="${f1(hx-hw*.5)}" y="${f1(hy-hh*.4)}" width="${f1(hw*2)}" height="${f1(hh*1.9)}" fill="url(#${gw})"/>`;
  if(c.imgs[0]){
    const hm=c.id(),hb=c.id(),hid=c.id(),hero=c.imgs[0];
    /* 主圖也只內嵌一份（倒影用 <use> 共用同一份 data URI） */
    const cell=`<svg x="${f1(hx)}" y="${f1(hy)}" width="${f1(hw)}" height="${f1(hh)}" viewBox="${cropVB(hero,hw,hh,.5,.5,1)}" preserveAspectRatio="none"><use href="#${hid}"/></svg>`;
    /* 主圖邊緣柔化：跟截圖牆的羽化同一個語言，不要像貼紙 */
    s+=`<defs><image id="${hid}" href="${hero.src}" width="${hero.w||1}" height="${hero.h||1}"/>`
     +`<filter id="${hb}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${f1(H*.012)}"/></filter>`
     +`<mask id="${hm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="${f1(hx)}" y="${f1(hy)}" width="${f1(hw)}" height="${f1(hh)}" fill="#fff" filter="url(#${hb})"/></mask></defs>`
     +`<g mask="url(#${hm})">${cell}</g>`;
    /* 倒影：主圖鏡射一份，往下淡出 */
    s+=`<g transform="translate(0 ${f1(2*(hy+hh))}) scale(1 -1)" opacity=".28" mask="url(#${gr}m)">${cell}</g>`;
  }
  /* 上方字標（大寫、字距放寬）＋下方字幕（壓在暗部，留安全邊距） */
  const tw0=W*.82;
  let ts=Math.min(72,Math.round(H*.062)),tl=wrap(c.t.title||' ',tw0,ts,c.tf,800).slice(0,2);
  const widow=()=>Math.max(...tl.map(l=>tw(l,ts*k,c.tf,800)+8*[...l].length));
  while(ts>26&&widow()>tw0){ts-=2;tl=wrap(c.t.title||' ',tw0,ts,c.tf,800).slice(0,2)}
  if(tl.length&&String(c.t.title||'').trim()){
    /* 字標後面壓一圈暗暈：白字壓在亮格子上會糊（參考圖 logo 就是压在暗处才读得出来） */
    const tg=c.id();
    s+=`<defs><radialGradient id="${tg}" gradientUnits="userSpaceOnUse" cx="${f1(W/2)}" cy="${f1(H*.075)}" r="${f1(W*.30)}"><stop offset="0" stop-color="${base}" stop-opacity=".92"/><stop offset=".55" stop-color="${base}" stop-opacity=".6"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient></defs>`
     +`<rect x="${f1(W*.14)}" y="0" width="${f1(W*.72)}" height="${f1(H*.22)}" fill="url(#${tg})"/>`
     +T(tl,{x:W/2,y:H*.055+ts*k*.92,size:ts,lh:1.15,fill:paper,font:c.tf,weight:800,anchor:'middle',ls:8,extra:`filter="url(#${c.ts})"`});
  }
  const cap=wrap(c.t.body,W-2*W*.10,Math.round(H*.030),c.bf,500).slice(0,3);
  const sub=wrap(c.t.subtitle,W-2*W*.10,Math.round(H*.019),c.bf,600).slice(0,1);
  const lh1=Math.round(H*.030)*k*1.62,capBot=H-H*.055;
  const capTop=capBot-(cap.length-1)*lh1;
  s+=`<rect x="0" y="${f1(H*.66)}" width="${W}" height="${f1(H*.34)}" fill="url(#${gr}b)"/>`;
  s+=`<defs><linearGradient id="${gr}b" gradientUnits="userSpaceOnUse" x1="0" y1="${f1(H*.64)}" x2="0" y2="${H}"><stop offset="0" stop-color="${base}" stop-opacity="0"/><stop offset=".5" stop-color="${base}" stop-opacity=".74"/><stop offset="1" stop-color="${base}" stop-opacity=".97"/></linearGradient></defs>`;
  if(cap.length)s+=T(cap,{x:W/2,y:capTop,size:Math.round(H*.030),lh:1.62,fill:paper,op:.94,font:c.bf,weight:500,anchor:'middle',ls:1});
  if(sub.length)s+=T(sub,{x:W/2,y:capTop-(sub.length?Math.round(H*.019)*k*2.2:0),size:Math.round(H*.019),fill:paper,op:.62,font:c.bf,weight:600,anchor:'middle',ls:6});
  return s;
}});
