/* ---------- 雜誌風（16:9）：襯線字、暖紙底、不對稱與留白 ---------- */
const SERIF="'Noto Serif TC','Source Han Serif TC','Songti TC','PMingLiU',serif";
const magPaper=c=>c.col.paper||'#f4efe6',magInk=c=>c.col.dk?c.col.ink:'#2b2621',magMute=c=>c.col.dk?c.col.mute:'#6d655c';
/* 首字放大：中文開頭時第一個字佔三行高、前三行縮排；英數開頭不放大（避免把單字拆開） */
function capLines(c,str,w,size){
  const txt=String(str||'').replace(/\s+/g,' ').trim();if(!txt)return{lines:[],n0:0,ch:'',dw:0};
  if(!/^[^\x00-\x7f]/.test(txt))return{lines:wrap(txt,w,size,c.bf),n0:0,ch:'',dw:0};
  const ch=[...txt][0],dw=size*4.6,l3=[];let rem=txt.slice(ch.length);
  for(let i=0;i<3&&rem;i++){const l=wrap(rem,w-dw,size,c.bf)[0]||'';if(!l)break;l3.push(l);rem=rem.slice(l.length).replace(/^\s/,'')}
  return{lines:[...l3,...(rem?wrap(rem,w,size,c.bf):[])],n0:l3.length,ch,dw};
}
/* 畫第 from～to 行；從第 0 行開始時連同放大的首字一起畫 */
function capDraw(c,cl,{x,y,size,from=0,to}){
  const k=FS,lh=size*k*1.75,L=cl.lines.slice(from,to),cut=from===0?Math.min(cl.n0,L.length):0;let s='';
  if(from===0&&cl.ch&&L.length)s+=T([cl.ch],{x,y:y+size*k+2*lh,size:f1(size*4.2),fill:c.col.acc,font:SERIF,weight:700});
  if(cut)s+=T(L.slice(0,cut),{x:x+cl.dw,y:y+size*k,size,lh:1.75,fill:magInk(c),font:c.bf});
  if(L.length>cut)s+=T(L.slice(cut),{x,y:y+size*k+cut*lh,size,lh:1.75,fill:magInk(c),font:c.bf});
  return s;
}

def({id:'mCover',cat:'mag',name:'雜誌風・封面',hint:'1 張照片；大數字當期數，副標題當專題名',render(c){
  const k=FS,x=130,w=900,ink=magInk(c);let sz=120;while(sz>72&&wrap(c.t.title,w,sz,SERIF,700).length>3)sz-=6;
  const tl=wrap(c.t.title,w,sz,SERIF,700).slice(0,3),bl=wrap(c.t.body,760,26,c.bf).slice(0,4),lh=sz*k*1.12;
  /* 標題＋短線＋內文整組放在版心下半，彼此不重疊 */
  const block=(tl.length-1)*lh+110+bl.length*26*k*1.8,ty=Math.max(260+sz*k,(H-block)/2+80),yEnd=ty+(tl.length-1)*lh;
  let s=bg(magPaper(c))+T([`NO.${c.t.number||'01'}`+(c.t.subtitle?`　—　${c.t.subtitle}`:'')],{x,y:150,size:24,fill:c.col.acc,font:c.bf,weight:700,ls:6});
  s+=`<line x1="${x}" y1="182" x2="${x+w}" y2="182" stroke="${ink}" stroke-width="1.5"/>`+T(tl,{x,y:ty,size:sz,lh:1.12,fill:ink,font:SERIF,weight:700});
  s+=`<line x1="${x}" y1="${f1(yEnd+48)}" x2="${x+120}" y2="${f1(yEnd+48)}" stroke="${c.col.acc}" stroke-width="4"/>`;
  s+=T(bl,{x,y:yEnd+110,size:26,lh:1.8,fill:magMute(c),font:c.bf});
  if(c.t.company||c.t.date)s+=T([[c.t.company,c.t.date].filter(Boolean).join('　')],{x,y:990,size:20,fill:magMute(c),font:c.bf,ls:4});
  s+=`<rect x="1196" y="96" width="644" height="888" fill="none" stroke="${ink}" stroke-width="1.5"/>`+IMG(c.imgs[0],1170,70,644,888);
  return s;
}});

def({id:'mFeature',cat:'mag',name:'雜誌風・專題',hint:'左側滿版照片；右側小標、標題、首字放大的內文',render(c){
  const k=FS,x=1080,w=700,ink=magInk(c);let sz=72;while(sz>48&&wrap(c.t.title,w,sz,SERIF,700).length>3)sz-=4;
  const tl=wrap(c.t.title,w,sz,SERIF,700).slice(0,3);
  let s=bg(magPaper(c))+IMG(c.imgs[0],0,0,960,H)+T([(c.t.subtitle||'FEATURE').toUpperCase()],{x,y:170,size:22,fill:c.col.acc,font:c.bf,weight:700,ls:6});
  s+=T(tl,{x,y:170+40+sz*k,size:sz,lh:1.18,fill:ink,font:SERIF,weight:700});
  let y=170+40+sz*k+(tl.length-1)*sz*k*1.18+50;s+=`<line x1="${x}" y1="${f1(y)}" x2="${x+w}" y2="${f1(y)}" stroke="${ink}" stroke-width="1"/>`;
  s+=capDraw(c,capLines(c,c.t.body,w,24),{x,y:y+40,size:24,to:Math.max(3,Math.floor((960-y-40)/(24*k*1.75)))});
  return s;
}});

def({id:'mColumns',cat:'mag',name:'雜誌風・兩欄文章',hint:'不用圖片；長內文分兩欄、首字放大，副標題當引言',render(c){
  const k=FS,ink=magInk(c),x=150,cw=760,gap=100;
  const tl=wrap(c.t.title,1500,64,SERIF,700).slice(0,2);let s=bg(magPaper(c));
  s+=`<line x1="${x}" y1="96" x2="${W-x}" y2="96" stroke="${ink}" stroke-width="3"/><line x1="${x}" y1="104" x2="${W-x}" y2="104" stroke="${ink}" stroke-width="1"/>`;
  s+=T(tl,{x:W/2,y:180+64*k*.2,size:64,lh:1.2,fill:ink,font:SERIF,weight:700,anchor:'middle'});
  let y=180+(tl.length)*64*k*1.2;
  if(c.t.subtitle){const ql=wrap(c.t.subtitle,1200,28,SERIF,400).slice(0,2);s+=T(ql,{x:W/2,y:y+20,size:28,lh:1.5,fill:c.col.acc,font:SERIF,anchor:'middle'});y+=20+ql.length*28*k*1.5}
  y+=30;s+=`<line x1="${x}" y1="${f1(y)}" x2="${W-x}" y2="${f1(y)}" stroke="${ink}" stroke-width="1"/>`;
  /* 內文平均分到兩欄（第一欄最多放滿一欄） */
  const per=Math.max(3,Math.floor((990-y-40)/(23*k*1.75))),cl=capLines(c,c.t.body,cw,23),n=cl.lines.length,c1=n>2*per?per:Math.ceil(n/2);
  s+=capDraw(c,cl,{x,y:y+40,size:23,to:c1});
  if(n>c1)s+=capDraw(c,cl,{x:x+cw+gap,y:y+40,size:23,from:c1,to:c1+per});
  s+=`<line x1="${x+cw+gap/2}" y1="${f1(y+30)}" x2="${x+cw+gap/2}" y2="980" stroke="${magMute(c)}" stroke-opacity=".4"/>`;
  return s;
}});

def({id:'mIndex',cat:'mag',name:'雜誌風・目錄',hint:'不用圖片；項目填「標題｜說明」，最多 8 項',render(c){
  const k=FS,ink=magInk(c),it=items(c).slice(0,8),two=it.length>4,cols=two?[[760,1800],[1290,1800]]:[[760,1800]];
  /* 大標題限制在左欄（寬 430）：太長就縮字，不換行以免撞到下面的副標 */
  const tit=c.t.title||'目錄',tw0=tw(tit,96*FS,SERIF,700),ts=tw0>430?Math.max(40,Math.floor(96*430/tw0)):96;
  let s=bg(magPaper(c))+T([tit],{x:130,y:300,size:ts,fill:ink,font:SERIF,weight:700});
  s+=`<line x1="130" y1="340" x2="560" y2="340" stroke="${c.col.acc}" stroke-width="4"/>`+T(wrap(c.t.subtitle,430,26,c.bf).slice(0,3),{x:130,y:400,size:26,lh:1.6,fill:magMute(c),font:c.bf});
  const per=two?Math.ceil(it.length/2):it.length,colW=two?470:1040,rh=Math.min(200,780/per);
  it.forEach((o,i)=>{const ci=two&&i>=per?1:0,x=two?(ci?1290:760):760,y=160+(i%per)*rh;
    s+=`<line x1="${x}" y1="${f1(y)}" x2="${x+colW}" y2="${f1(y)}" stroke="${ink}" stroke-opacity=".35"/>`;
    s+=T([pad2(i)],{x,y:y+64,size:44,fill:c.col.acc,font:SERIF,weight:700})+T(wrap(o.a,colW-100,34,SERIF,700).slice(0,1),{x:x+100,y:y+58,size:34,fill:ink,font:SERIF,weight:700})
     +T(wrap(o.b,colW-100,22,c.bf).slice(0,2),{x:x+100,y:y+100,size:22,lh:1.5,fill:magMute(c),font:c.bf})});
  return s;
}});

