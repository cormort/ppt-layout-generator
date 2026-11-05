/* ---------- 章節頁・大數字色塊：不用照片的章節頁（沒有照片時的替代方案） ---------- */
def({id:'secPlain',cat:'sec',name:'章節頁・大數字色塊',hint:'不用照片；色塊放章節數字、另一側放章名，任何尺寸都能用',ratios:ALLR,render(c){
  const k=FS,wide=W>H,pad=PAD(),paper=c.col.paper||'#ffffff';
  const num=c.t.number||'01';
  /* 寬版面：左側色塊、右側文字；直式：上方色塊、下方文字 */
  const bw=wide?W*.44:H*.42,bh=wide?H:bw;
  const ts=Math.min(wide?296:H*.2,Math.round(Math.min(bw,bh)*.46));
  const ink='#ffffff';
  let s=bg(paper);
  /* 色塊：主色，右下角壓一層深色斜切，讓大數字有底 */
  s+=`<path d="${P([[0,0],[bw,0],[bw,bh],[0,bh]])}" fill="${c.col.main}"/>`
   +`<path d="${P(wide?[[0,bh*.62],[bw*.72,bh],[0,bh]]:[[bw*.55,0],[bw,0],[bw,bh*.5]])}" fill="${c.col.dark}" opacity=".16"/>`;
  /* 大數字：貼齊色塊下緣／右緣，太寬就縮字 */
  let ns=ts;
  const numW=()=>tw(num,ns*k,c.tf,900);
  while(ns>60&&numW()>bw-pad*1.1)ns-=6;
  if(wide){
    s+=T(['CHAPTER'],{x:pad*.6,y:bh-pad*1.05-ns*k*1.02,size:24,fill:ink,op:.62,font:c.bf,weight:700,ls:12})
     +`<text x="${f1(pad*.6)}" y="${f1(bh-pad*.55)}" font-size="${f1(ns*k)}" font-family="${esc(c.tf)}" font-weight="900" fill="${ink}" letter-spacing="-4">${esc(num)}</text>`;
  }else{
    s+=T(['CHAPTER'],{x:pad*.6,y:pad*.9,size:22,fill:ink,op:.62,font:c.bf,weight:700,ls:10})
     +`<text x="${f1(pad*.6)}" y="${f1(bh-pad*.7)}" font-size="${f1(ns*k)}" font-family="${esc(c.tf)}" font-weight="900" fill="${ink}" letter-spacing="-4">${esc(num)}</text>`;
  }
  /* 文字側：標題／副標／內文，垂直置中 */
  const tx=wide?bw+pad*1.1:pad,tw0=wide?W-bw-pad*1.6:W-2*pad;
  let tl=wrap(c.t.title,tw0,wide?88:72,c.tf,800);
  let tts=wide?88:72;
  while(tts>36&&tl.length>3){tts-=4;tl=wrap(c.t.title,tw0,tts,c.tf,800)}
  const sl=c.t.subtitle?wrap(c.t.subtitle,tw0,wide?30:26,c.bf,600).slice(0,2):[];
  const bl=c.t.body?wrap(c.t.body,tw0,wide?24:22,c.bf).slice(0,3):[];
  const th=(tl.length-1)*tts*k*1.2+tts*k;
  const tot=40+th+(sl.length?26+sl.length*(wide?30:26)*k*1.5:0)+(bl.length?34+bl.length*(wide?24:22)*k*1.7:0);
  const cy=wide?H*.5:H*.42+ (H-H*.42)/2;
  let y=cy-tot/2+tts*k*.82;
  s+=`<rect x="${f1(tx)}" y="${f1(y-tts*k*1.18)}" width="96" height="7" rx="3.5" fill="${c.col.acc}"/>`
   +T(tl,{x:tx,y,size:tts,lh:1.2,fill:c.col.ink,font:c.tf,weight:800});
  y+=(tl.length-1)*tts*k*1.2+tts*k*.3;
  if(sl.length)s+=T(sl,{x:tx,y:y+36,size:wide?30:26,lh:1.5,fill:c.col.mt,font:c.bf,weight:600});y+=36+(sl.length-1)*(wide?30:26)*k*1.5;
  if(bl.length)s+=T(bl,{x:tx,y:y+(sl.length?40:60),size:wide?24:22,lh:1.7,fill:c.col.mute,font:c.bf});
  return s;
}});
