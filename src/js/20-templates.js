/* ---------- templates ---------- */
const TPL=[];const def=o=>TPL.push(o);

def({id:'diamond',cat:'shape',name:'菱形拼貼',hint:'多張循環（共 21 格）',render(c){
  const a=150,D=a*Math.SQRT2,st=(D+18)/2,cx=960,cy=548;
  const cells=[[-4,-2],[2,-2],[-5,-1],[-3,-1],[1,-1],[3,-1],[-6,0],[-4,0],[-2,0],[0,0],[2,0],[4,0],[6,0],[-5,1],[-3,1],[-1,1],[1,1],[3,1],[5,1],[-2,2],[4,2]];
  const sh=cells.map(([i,j])=>{const x=cx+i*st,y=cy+j*st;return{el:`<rect x="${-a/2}" y="${-a/2}" width="${a}" height="${a}" rx="22" transform="translate(${f1(x)} ${f1(y)}) rotate(45)"/>`,b:[x-D/2,y-D/2,D,D]}});
  return bg(c.col.paper||c.col.light)+T(wrap(c.t.title,1600,74,c.tf,700).slice(0,1),{x:960,y:138,size:74,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'})
   +T([c.t.subtitle],{x:960,y:192,size:26,fill:c.col.mt,font:c.bf,weight:600,ls:6,anchor:'middle'})
   +mosaic(c,sh)+T(wrap(c.t.body,1400,25,c.bf).slice(0,2),{x:960,y:950,size:25,lh:1.7,fill:c.col.mute,font:c.bf,anchor:'middle'});
}});

def({id:'heart',cat:'shape',name:'心形拼貼',hint:'多張循環（約 45 格）',render(c){
  const cx=1330,cy=540,k=26,s=58,st=68,sh=[];
  const outline=[...Array(72)].map((_,i)=>{const t=i/72*Math.PI*2;return[cx+k*16*Math.sin(t)**3,cy-20-k*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))]});
  const inside=(x,y)=>{let o=false;for(let i=0,j=71;i<72;j=i++){const[a,b]=outline[i],[p,q]=outline[j];if((b>y)!==(q>y)&&x<(p-a)*(y-b)/(q-b)+a)o=!o}return o};
  for(let gy=cy-476;gy<=cy+476;gy+=st)for(let gx=cx-476;gx<=cx+476;gx+=st)
    if(inside(gx,gy))sh.push({el:`<rect x="${gx-s/2}" y="${gy-s/2}" width="${s}" height="${s}" rx="14"/>`,b:[gx-s/2,gy-s/2,s,s]});
  return bg(c.col.paper||mix(c.col.light,'#ffffff',.4))+`<circle cx="${cx}" cy="${cy}" r="430" fill="${c.col.paper?mix(c.col.paper,c.col.main,.12):c.col.light}"/>`+mosaic(c,sh)
   +stack(c,{x:150,cy:540,w:640,tSize:80,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'hex',cat:'shape',name:'六邊形蜂巢',hint:'多張循環（約 20 格）',render(c){
  const r=100,dr=93,cx=1290,cy=540,sh=[];
  for(let j=-2;j<=2;j++)for(let i=-4;i<=4;i++){
    const x=cx+(i+(j&1)*.5)*Math.sqrt(3)*r,y=cy+j*1.5*r;
    if(((x-cx)/520)**2+((y-cy)/390)**2>1)continue;
    const pts=[...Array(6)].map((_,k)=>{const a=(60*k-90)*Math.PI/180;return[x+dr*Math.cos(a),y+dr*Math.sin(a)]});sh.push(polyShape(pts));
  }
  return bg(c.col.paper||c.col.light)+mosaic(c,sh)+stack(c,{x:140,cy:540,w:560,tSize:82,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'tree',cat:'shape',name:'葉形大樹',hint:'1 張最佳（也可多張）',render(c){
  const tx=1390,sh=[];
  const leaf=(L,h,ang,x,y)=>{const pts=rot([[0,0],[L,0],[L/2,-h/2],[L/2,h/2]],ang,x,y);return{el:`<path d="M0,0Q${f1(L/2)},${f1(-h)} ${f1(L)},0Q${f1(L/2)},${f1(h)} 0,0Z" transform="translate(${f1(x)} ${f1(y)}) rotate(${ang})"/>`,b:bbox(pts)}};
  for(let k=0;k<7;k++){const y=905-k*105,L=330-k*30,h=L*.42;sh.push(leaf(L,h,205,tx-6,y),leaf(L,h,335,tx+6,y-40))}
  sh.push(leaf(170,80,270,tx,250));
  return bg(c.col.paper||mix(c.col.light,'#ffffff',.5))+`<line x1="${tx}" y1="990" x2="${tx}" y2="260" stroke="${c.col.dark}" stroke-width="7" stroke-linecap="round" opacity=".55"/>`
   +mosaic(c,sh)+stack(c,{x:150,cy:540,w:640,tSize:80,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'triangle',cat:'cover',name:'封面・三角切割',hint:'1 張',render(c){
  const white=[[0,0],[1080,0],[660,540],[1080,1080],[0,1080]],acc=[[1080,0],[1170,0],[750,540],[1170,1080],[1080,1080],[660,540]];
  return IMG(c.imgs[0],0,0,W,H)+`<path d="${P(white)}" fill="${c.col.paper||'#fff'}"/><path d="${P(acc)}" fill="${c.col.main}" opacity=".88"/>`
   +`<path d="${P([[0,1080],[0,820],[260,1080]])}" fill="${c.col.main}" opacity=".9"/>`
   +stack(c,{x:130,cy:520,w:500,tSize:80,tColor:c.col.ink,sColor:c.col.mt,bSize:24});
}});

def({id:'curve',cat:'cover',name:'封面・弧形半版',hint:'1 張',render(c){
  const cv=dx=>`M${900+dx},0C${1180+dx},320 ${760+dx},700 ${1060+dx},1080L1920,1080L1920,0Z`;const id=c.id();
  return bg(c.col.paper||'#fff')+`<path d="${cv(-46)}" fill="${c.col.main}"/><path d="${cv(-22)}" fill="${c.col.soft}"/>`
   +`<defs><clipPath id="${id}"><path d="${cv(0)}"/></clipPath></defs><g filter="url(#${c.sh})">${IMG(c.imgs[0],760,0,1160,1080,`clip-path="url(#${id})"`)}</g>`
   +stack(c,{x:150,cy:540,w:600,tSize:84,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'pills',cat:'cover',name:'封面・膠囊豎條',hint:'1 張最佳',render(c){
  const g=c.id(),tops=[430,300,200,330,150,260,380,220,320,460],bots=[760,880,700,940,820,980,760,900,700,860],sh=[];
  tops.forEach((t,i)=>{const x=980+i*86;sh.push({el:`<rect x="${x}" y="${t}" width="64" height="${bots[i]-t}" rx="32"/>`,b:[x,t,64,bots[i]-t]})});
  return IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}"><stop offset="0" stop-color="${c.col.paper||'#fff'}"/><stop offset=".45" stop-color="${c.col.paper||'#fff'}" stop-opacity=".93"/><stop offset="1" stop-color="${c.col.paper||'#fff'}" stop-opacity=".6"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +mosaic(c,sh,{box:[0,0,W,H]})+stack(c,{x:150,cy:540,w:680,tSize:84,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'waves',cat:'cover',name:'封面・層疊色帶',hint:'1 張',render(c){
  const wv=(x,a)=>`M0,0L${x},0C${x+a},270 ${x-a},520 ${x+a*.4},700S${x+a},960 ${x-a*.3},1080L0,1080Z`;
  return IMG(c.imgs[0],0,0,W,H)+`<path d="${wv(930,120)}" fill="${c.col.soft}" opacity=".6"/><path d="${wv(850,140)}" fill="${c.col.main}" opacity=".85"/><path d="${wv(770,100)}" fill="${c.col.dark}"/>`
   +stack(c,{x:130,cy:540,w:560,tSize:84,tColor:'#fff',sColor:'#fff',bColor:'rgba(255,255,255,.88)'});
}});

def({id:'knockout',cat:'cover',name:'大字鏤空＋豎條',hint:'1 張',render(c){
  const t=c.t.title||' ',size=Math.min(210,100*1080/Math.max(1,tw(t,100,c.tf,800))),id=c.id(),bl=c.id();
  const tops=[380,250,320,180,290,420,260,350],bots=[700,820,640,860,760,900,700,800],sh=[];
  tops.forEach((y,i)=>{const x=1220+i*76;sh.push({el:`<rect x="${x}" y="${y}" width="56" height="${bots[i]-y}" rx="28"/>`,b:[x,y,56,bots[i]-y]})});
  const tt=`<text x="130" y="560" font-size="${f1(size)}" font-family="${esc(c.tf)}" font-weight="800">${esc(t)}</text>`;
  return IMG(c.imgs[0],0,0,W,H)+`<rect width="${W}" height="${H}" fill="${c.col.paper||'#fff'}" opacity=".8"/>`+mosaic(c,sh,{box:[0,0,W,H]})
   +`<defs><clipPath id="${id}">${tt}</clipPath><filter id="${bl}"><feGaussianBlur stdDeviation="5"/></filter></defs>`
   +`<g opacity=".22" fill="${c.col.dark}" filter="url(#${bl})" transform="translate(5 8)">${tt}</g>`+IMG(c.imgs[0],0,0,W,H,`clip-path="url(#${id})"`)
   +`<g fill="none" stroke="${c.col.dark}" stroke-opacity=".35" stroke-width="2">${tt}</g>`
   +T([c.t.subtitle],{x:136,y:560+64,size:48,fill:c.col.ink,font:c.bf,weight:700})
   +T(wrap(c.t.body,900,24,c.bf).slice(0,3),{x:136,y:700,size:24,lh:1.7,fill:c.col.mute,font:c.bf});
}});

def({id:'fanToc',cat:'toc',name:'目錄・半環扇形',hint:'每個項目 1 張',render(c){
  const it=items(c),n=Math.max(2,Math.min(8,it.length)),R=720,r=250,cx=960,cy=1080,g=.012,sh=[];let lab='';
  for(let i=0;i<n;i++){const a0=Math.PI+i*Math.PI/n+g/2,a1=Math.PI+(i+1)*Math.PI/n-g/2,am=(a0+a1)/2;sh.push(annular(cx,cy,R,r,a0,a1));
    const lx=cx+(R+r)/2*Math.cos(am)*1.04,ly=cy+(R+r)/2*Math.sin(am)*1.04;
    lab+=T([it[i]?.a||''],{x:lx,y:ly,size:36,fill:'#fff',font:c.tf,weight:700,anchor:'middle',extra:`filter="url(#${c.ts})"`})
       +T([it[i]?.b||''],{x:lx,y:ly+34,size:18,fill:'#fff',font:c.bf,anchor:'middle',ls:1,extra:`filter="url(#${c.ts})"`});}
  return IMG(c.imgs[0],0,0,W,H)+`<rect width="${W}" height="${H}" fill="${c.col.paper||'#fff'}" opacity=".86"/>`+mosaic(c,sh)+lab
   +T([c.t.title],{x:960,y:180,size:84,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle',ls:8})
   +T([c.t.subtitle],{x:960,y:236,size:24,fill:c.col.mt,font:c.bf,weight:600,anchor:'middle',ls:6});
}});

def({id:'glass',cat:'toc',name:'目錄・霧面豎板',hint:'1 張背景',render(c){
  const it=items(c),n=Math.max(2,Math.min(6,it.length)),cols=strip(200,1720,n,36),cl=c.id(),bl=c.id();let rects='',txt='';
  cols.forEach(([a,b],i)=>{const w=b-a,x=a+w/2;rects+=`<rect x="${f1(a)}" y="250" width="${f1(w)}" height="640" rx="22"/>`;
    txt+=T([pad2(i)],{x,y:440,size:100,fill:c.col.main,font:c.tf,weight:300,anchor:'middle'})+`<rect x="${f1(x-24)}" y="478" width="48" height="4" rx="2" fill="${c.col.main}" opacity=".7"/>`
      +T(wrap(it[i]?.a||'',w-40,38,c.tf,700).slice(0,2),{x,y:560,size:38,fill:c.col.dark,font:c.tf,weight:700,anchor:'middle',lh:1.25})
      +T(wrap(it[i]?.b||'',w-50,21,c.bf).slice(0,4),{x,y:660,size:21,fill:'#555',font:c.bf,anchor:'middle',lh:1.5})});
  return IMG(c.imgs[0],0,0,W,H)+`<defs><clipPath id="${cl}">${rects}</clipPath><filter id="${bl}" x="0" y="0" width="1" height="1"><feGaussianBlur stdDeviation="24" edgeMode="duplicate"/></filter></defs>`
   +`<g filter="url(#${c.sh})"><g clip-path="url(#${cl})">${IMG(c.imgs[0],0,0,W,H,`filter="url(#${bl})"`)}<rect width="${W}" height="${H}" fill="#fff" opacity=".58"/></g></g>`
   +`<g fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="2">${rects}</g>`+txt
   +T([c.t.title],{x:960,y:170,size:66,fill:'#fff',font:c.tf,weight:700,anchor:'middle',ls:6,extra:`filter="url(#${c.ts})"`});
}});

def({id:'screens',cat:'toc',name:'目錄・弧面屏',hint:'1 張連續 / 多張分屏',render(c){
  const it=items(c),n=Math.max(2,Math.min(6,it.length)),u=x=>(x-960)/810,top=x=>300-100*u(x)**2,bot=x=>820+100*u(x)**2;let lab='';
  const sh=strip(150,1770,n,30).map(([a,b],i)=>{const xc=(a+b)/2;
    lab+=T([pad2(i)],{x:xc,y:bot(xc)+58,size:40,fill:c.col.mt,font:c.tf,weight:800,anchor:'middle'})+T([it[i]?.a||''],{x:xc,y:bot(xc)+100,size:28,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'});
    return polyShape(band(a,b,top,bot));});
  return IMG(c.imgs[0],0,0,W,H)+`<rect width="${W}" height="${H}" fill="${c.col.paper||'#fff'}" opacity=".84"/>`+mosaic(c,sh,{box:[150,180,1620,760]})+lab
   +T([c.t.title],{x:960,y:140,size:68,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle',ls:6})
   +T([c.t.subtitle],{x:960,y:190,size:22,fill:c.col.mt,font:c.bf,weight:600,anchor:'middle',ls:5});
}});

def({id:'waveBand',cat:'grid',name:'波浪分格',hint:'3–6 張（或 1 張連續）',render(c){
  const n=nOf(c,2,6,4),top=x=>230+60*Math.sin((x-120)/1680*Math.PI*2+.6),bot=x=>top(x)+420,g=c.id();
  const sh=strip(120,1800,n,16).map(([a,b])=>polyShape(band(a,b,top,bot)));
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.paper||'#fff'}"/><stop offset="1" stop-color="${c.col.paper?mix(c.col.paper,c.col.main,.12):c.col.light}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +mosaic(c,sh)+T(['›››'],{x:1790,y:150,size:90,fill:c.col.soft,font:'Arial',weight:700,anchor:'end'})
   +T([c.t.title],{x:960,y:830,size:62,fill:c.col.mt,font:c.tf,weight:700,anchor:'middle'})
   +T(wrap(c.t.body,1350,24,c.bf).slice(0,3),{x:960,y:890,size:24,lh:1.7,fill:c.col.mute,font:c.bf,anchor:'middle'});
}});

def({id:'arch',cat:'grid',name:'弧頂分格',hint:'3–6 張（或 1 張連續）',render(c){
  const n=nOf(c,2,6,4),top=x=>410+120*(1-((x-960)/840)**2),bot=()=>990,g=c.id();
  const sh=strip(120,1800,n,14).map(([a,b])=>polyShape(band(a,b,top,bot)));
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.paper?mix(c.col.paper,c.col.main,.12):c.col.light}"/><stop offset="1" stop-color="${c.col.paper||'#fff'}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +mosaic(c,sh)+T([c.t.title],{x:960,y:180,size:66,fill:c.col.mt,font:c.tf,weight:700,anchor:'middle'})
   +T(wrap(c.t.body,1300,24,c.bf).slice(0,3),{x:960,y:250,size:24,lh:1.7,fill:c.col.mute,font:c.bf,anchor:'middle'});
}});

def({id:'fan',cat:'grid',name:'扇形畫廊',hint:'3–6 張（或 1 張連續）',render(c){
  const n=nOf(c,2,7,5),cx=960,cy=1650,R=1250,r=760,A0=236*Math.PI/180,A1=304*Math.PI/180,g=.006,sh=[];
  for(let i=0;i<n;i++)sh.push(annular(cx,cy,R,r,A0+(A1-A0)*i/n+g/2,A0+(A1-A0)*(i+1)/n-g/2));
  return bg(c.col.paper||mix(c.col.light,'#ffffff',.3))+mosaic(c,sh)+T([c.t.title],{x:960,y:170,size:66,fill:c.col.mt,font:c.tf,weight:700,anchor:'middle'})
   +T(wrap(c.t.body,1300,24,c.bf).slice(0,3),{x:960,y:240,size:24,lh:1.7,fill:c.col.mute,font:c.bf,anchor:'middle'});
}});

def({id:'bignum',cat:'sec',name:'章節頁・大數字鏤空',hint:'1 張；可依項目清單連續編號 01、02…',render(c){
  const num=c.t.number||'01',size=Math.min(780,100*860/Math.max(1,tw(num,100,c.tf,900))),id=c.id(),cl=c.id();
  const tt=`<text x="120" y="790" font-size="${f1(size)}" font-family="${esc(c.tf)}" font-weight="900">${esc(num)}</text>`,poly=[[1000,0],[1920,0],[1920,1080],[780,1080]];
  return bg(c.col.dark)+`<defs><clipPath id="${id}">${tt}</clipPath><clipPath id="${cl}"><path d="${P(poly)}"/></clipPath></defs>`
   +IMG(c.imgs[0],0,0,W,H,`clip-path="url(#${cl})"`)+IMG(c.imgs[0],0,0,W,H,`clip-path="url(#${id})"`)
   +`<g fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3">${tt}</g>`
   +T([c.t.title],{x:140,y:930,size:60,fill:'#fff',font:c.tf,weight:700})+T([c.t.subtitle],{x:142,y:984,size:24,fill:'#fff',op:.75,font:c.bf,ls:5});
}});

/* 章節頁共用：數字下方的細線＋章名＋副標 */
function secText(c,{x,y,w=700,tSize=72,tColor,sColor,lineColor}){
  const tl=wrap(c.t.title,w,tSize,c.tf,700).slice(0,2),k=FS;
  return `<rect x="${x}" y="${f1(y)}" width="96" height="6" rx="3" fill="${lineColor}"/>`
   +T(tl,{x,y:y+tSize*k+48,size:tSize,lh:1.18,fill:tColor,font:c.tf,weight:700})
   +T([c.t.subtitle],{x:x+2,y:y+tSize*k+48+(tl.length-1)*tSize*k*1.18+tSize*k*.4+34,size:28,fill:sColor,font:c.bf,weight:600,ls:4});
}
def({id:'secFade',cat:'sec',name:'章節頁・數字＋淡出照片',hint:'1 張；可連續編號 01、02…',render(c){
  const num=c.t.number||'01',m=c.id(),g=c.id(),ng=c.id(),size=Math.min(400,100*680/Math.max(1,tw(num,100,c.tf,900)));
  return bg(c.col.paper||'#fff')
   +`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset=".42" stop-color="#fff"/></linearGradient>`
   +`<mask id="${m}" maskUnits="userSpaceOnUse" x="700" y="0" width="1220" height="${H}"><rect x="700" width="1220" height="${H}" fill="url(#${g})"/></mask>`
   +`<linearGradient id="${ng}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.acc}"/><stop offset="1" stop-color="${c.col.main}"/></linearGradient></defs>`
   +IMG(c.imgs[0],700,0,1220,H,`mask="url(#${m})"`)
   +`<text x="130" y="500" font-size="${f1(size)}" font-family="${esc(c.tf)}" font-weight="900" fill="url(#${ng})">${esc(num)}</text>`
   +secText(c,{x:150,y:560,tColor:c.col.ink,sColor:c.col.mt,lineColor:c.col.acc});
}});
def({id:'secStrip',cat:'sec',name:'章節頁・CHAPTER 豎條照片',hint:'1 張；可連續編號 01、02…',render(c){
  const num=c.t.number||'01',cl=c.id(),size=Math.min(360,100*820/Math.max(1,tw(num,100,c.tf,900)));
  return bg(c.col.paper||c.col.light)+`<rect x="1220" width="${W-1220}" height="${H}" fill="${c.col.paper?mix(c.col.paper,c.col.main,.1):'#fff'}"/>`
   +`<defs><clipPath id="${cl}"><rect x="1300" y="0" width="380" height="${H}"/><rect x="1720" y="0" width="64" height="${H}"/></clipPath></defs>`
   +`<g filter="url(#${c.sh})">${IMG(c.imgs[0],1300,0,484,H,`clip-path="url(#${cl})"`)}</g>`
   +`<rect x="1220" y="160" width="6" height="760" fill="${c.col.acc}"/>`
   +T(['CHAPTER'],{x:150,y:250,size:30,fill:c.col.mt,font:'Arial,'+c.bf,weight:700,ls:14})
   +T([num],{x:132,y:250+size*.9,size:f1(size),fill:c.col.main,font:c.tf,weight:900,fixed:true})
   +secText(c,{x:150,y:250+size*.9+70,w:960,tColor:c.col.ink,sColor:c.col.mt,lineColor:c.col.acc});
}});
def({id:'secFull',cat:'sec',name:'章節頁・滿版照片＋大數字',hint:'1 張；可連續編號 01、02…',render(c){
  const num=c.t.number||'01',g=c.id(),size=Math.min(520,100*900/Math.max(1,tw(num,100,c.tf,900)));
  return IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.col.dark}" stop-opacity=".9"/><stop offset=".45" stop-color="${c.col.dark}" stop-opacity=".55"/><stop offset=".75" stop-color="${c.col.dark}" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +T([num],{x:120,y:600,size:f1(size),fill:'#fff',op:.92,font:c.tf,weight:900,fixed:true})
   +secText(c,{x:140,y:660,w:900,tSize:76,tColor:'#fff',sColor:c.col.acc,lineColor:c.col.acc});
}});

def({id:'ring',cat:'toc',name:'目錄・圓環',hint:'1 張',render(c){
  const it=items(c),n=Math.min(7,it.length),cx=1720,cy=540,R=440,r=270,id=c.id(),st=Math.min(160,660/n),y0=540-st*(n-1)/2;
  const ring=`M${cx-R},${cy}a${R},${R} 0 1,0 ${2*R},0a${R},${R} 0 1,0 ${-2*R},0ZM${cx-r},${cy}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0Z`;
  const ch=[...String(c.t.title||'')],ts=Math.min(120,440/Math.max(1,ch.length*1.12));let list='';
  it.slice(0,n).forEach((o,i)=>{const y=y0+i*st;list+=`<circle cx="270" cy="${f1(y)}" r="42" fill="${c.col.main}"/>`+T([pad2(i)],{x:270,y:y+12,size:34,fill:'#fff',font:c.bf,weight:700,anchor:'middle'})
    +T([o.a],{x:350,y:y+(o.b?4:16),size:50,fill:c.col.ink,font:c.tf,weight:700})+T([o.b],{x:352,y:y+44,size:24,fill:c.col.mute,font:c.bf,ls:1})});
  return bg(c.col.paper||'#fff')+`<circle cx="${cx}" cy="${cy}" r="${R+36}" fill="none" stroke="${c.col.soft}" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/>`
   +`<defs><clipPath id="${id}"><path d="${ring}" clip-rule="evenodd"/></clipPath></defs><g filter="url(#${c.sh})">${IMG(c.imgs[0],cx-R,cy-R,2*R,2*R,`clip-path="url(#${id})"`)}</g>`
   +VT(c.t.title,{x:cx-30,y:cy-ch.length*ts*1.12/2+ts*.85,size:ts,fill:c.col.mt,font:c.tf,weight:700})
   +T([c.t.subtitle],{x:230,y:140,size:24,fill:c.col.mt,font:c.bf,weight:700,ls:6})+list;
}});

/* 大字編號目錄：1 2 3 4 當視覺主角，章名接在數字下面；16:9 排一列，直式排 2×N */
def({id:'tocNum',cat:'toc',name:'目錄・大字編號',hint:'不用照片；項目每行一章，數字自動 1 2 3 4',ratios:ALLR,render(c){
  const h=hdr(c,{tMax:64}),k=FS,P=PAD(),it=items(c).slice(0,4),n=Math.max(1,it.length),wide=W>H;
  /* 直式：1–2 章排一欄（數字才夠大），3 章以上排 2 欄 */
  const nc=wide?n:(n<=2?1:2),rows=Math.max(1,Math.ceil(n/nc));
  const gapC=wide?44:32,rowH=(H-h.y-P)/rows,colW=(W-2*P-(nc-1)*gapC)/nc;
  const num=Math.min(wide?196:150,Math.round(colW*.56));
  const cellH=num*k+44+40*k*1.25+2*24*k*1.5;
  let s=bg(c.col.paper||'#fff')+h.s;
  it.forEach((o,i)=>{
    const ci=i%nc,ri=Math.floor(i/nc),x=P+ci*(colW+gapC);
    const y0=h.y+ri*rowH+Math.max(0,(rowH-cellH)/2);
    const bl=wrap(o.b||'',colW,24,c.bf).slice(0,2),al=wrap(o.a||'',colW,40,c.tf,700).slice(0,1);
    s+=`<text x="${f1(x)}" y="${f1(y0+num*k*.82)}" font-size="${f1(num*k)}" font-family="${esc(c.tf)}" font-weight="800" fill="${c.col.acc}" opacity=".92" letter-spacing="-2">${pad2(i)}</text>`
      +`<rect x="${f1(x)}" y="${f1(y0+num*k+18)}" width="${f1(Math.min(colW,84))}" height="5" rx="2.5" fill="${c.col.main}"/>`
      +T(al,{x,y:y0+num*k+18+44+40*k*.8,size:40,fill:c.col.ink,font:c.tf,weight:700});
    if(bl.length)s+=T(bl,{x,y:y0+num*k+18+44+40*k*.8+42,size:24,lh:1.5,fill:c.col.mute,font:c.bf});
  });
  return s;
}});

/* 對比：兩張照片並排，底部色帶放「之前／之後」標籤與說明；直式改成上下堆疊 */
def({id:'cmp',cat:'cmp',name:'對比・前後色帶',hint:'2 張照片並排；項目只取前 2 項：「之前|說明」「之後|說明」',maxItems:2,ratios:ALLR,render(c){
  const k=FS,P=PAD(),wide=W>H,gap=Math.max(6,Math.round((wide?W:H)*.01));
  const it=items(c),A=it[0]||{a:'之前',b:''},B=it[1]||{a:'之後',b:''};
  const gL=c.id(),gR=c.id(),im=ii=>c.imgs[Math.min(ii,c.imgs.length-1)];
  const grad=id=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.dark}" stop-opacity="0"/><stop offset="1" stop-color="${c.col.dark}" stop-opacity=".93"/></linearGradient>`;
  /* bottom＝這一格的底邊，標籤與說明都貼著它往上排（要讓開頁尾） */
  const block=(o,x,w,bottom)=>{
    const bl=wrap(o.b||'',w-P*.8,26,c.bf).slice(0,2),lh=26*k*1.55;
    const first=bottom-Math.max(P*.55,footH()+18)-(bl.length?bl.length*lh:0),by=first-56*k-18;
    const bw=Math.min(w-P*.8,tw(o.a,32*k,c.bf,800)+64);
    return `<rect x="${f1(x+(w-bw)/2)}" y="${f1(by)}" width="${f1(bw)}" height="${f1(56*k)}" rx="${f1(28*k)}" fill="${c.col.acc}"/>`
      +T([o.a],{x:x+w/2,y:by+37*k,size:32,fill:c.col.dark,font:c.bf,weight:800,anchor:'middle'})
      +(bl.length?T(bl,{x:x+w/2,y:first,size:26,lh:1.55,fill:'#fff',op:.92,font:c.bf,anchor:'middle'}):'');
  };
  let s,ax,ay,aw,ah,bx,by2,bw2,bh;
  if(wide){const half=(W-gap)/2;ax=0;ay=0;aw=half;ah=H;bx=half+gap;by2=0;bw2=half;bh=H}
  else{const half=(H-gap)/2;ax=0;ay=0;aw=W;ah=half;bx=0;by2=half+gap;bw2=W;bh=half}
  s=IMG(im(0),ax,ay,aw,ah)+IMG(im(1),bx,by2,bw2,bh)+`<defs>${grad(gL)}${grad(gR)}</defs>`
   +`<rect x="${f1(ax)}" y="${f1(ay+ah*.45)}" width="${f1(aw)}" height="${f1(ah*.55)}" fill="url(#${gL})"/>`
   +`<rect x="${f1(bx)}" y="${f1(by2+bh*.45)}" width="${f1(bw2)}" height="${f1(bh*.55)}" fill="url(#${gR})"/>`
   +block(A,ax,aw,ay+ah)+block(B,bx,bw2,by2+bh)
   +(wide?`<rect x="${f1(ax+aw)}" y="0" width="${gap}" height="${H}" fill="${c.col.paper||'#fff'}"/>`
         :`<rect x="0" y="${f1(ay+ah)}" width="${W}" height="${gap}" fill="${c.col.paper||'#fff'}"/>`);
  if(c.t.title){const tl=wrap(c.t.title,W-2*P,44,c.tf,700).slice(0,1);
    s=`<rect x="0" y="0" width="${W}" height="${f1(92*k)}" fill="${c.col.dark}" opacity=".62"/>`+s
      +T(tl,{x:W/2,y:58*k,size:44,fill:'#fff',font:c.tf,weight:700,anchor:'middle'})}
  return s;
}});

/* 對比：兩張圓角照片＋中間 VS 圓標，標籤與說明放在照片下面 */
def({id:'cmpVs',cat:'cmp',name:'對比・VS 圓標',hint:'2 張照片；項目只取前 2 項：「A|說明」「B|說明」',maxItems:2,ratios:ALLR,render(c){
  const h=hdr(c,{tMax:60}),k=FS,P=PAD(),gap=Math.max(30,Math.round(W*.035)),colW=(W-2*P-gap)/2;
  const it=items(c),A=it[0]||{a:'A',b:''},B=it[1]||{a:'B',b:''},top=h.y;
  const photoH=Math.min(H*.5,Math.max(H*.26,H-top-P*2.6)),id1=c.id(),id2=c.id();
  const im=ii=>c.imgs[Math.min(ii,c.imgs.length-1)];
  let s=bg(c.col.paper||'#fff')+h.s
   +`<defs><clipPath id="${id1}"><rect x="${f1(P)}" y="${f1(top)}" width="${f1(colW)}" height="${f1(photoH)}" rx="18"/></clipPath>`
   +`<clipPath id="${id2}"><rect x="${f1(P+colW+gap)}" y="${f1(top)}" width="${f1(colW)}" height="${f1(photoH)}" rx="18"/></clipPath></defs>`
   +`<g filter="url(#${c.sh})">${IMG(im(0),P,top,colW,photoH,`clip-path="url(#${id1})"`)}${IMG(im(1),P+colW+gap,top,colW,photoH,`clip-path="url(#${id2})"`)}</g>`;
  const cr=Math.min(66,colW*.17);
  s+=`<circle cx="${W/2}" cy="${f1(top+photoH/2)}" r="${f1(cr)}" fill="${c.col.acc}" stroke="${c.col.paper||'#fff'}" stroke-width="9"/>`
   +T(['VS'],{x:W/2,y:top+photoH/2+cr*.33,size:f1(cr*.92),fill:c.col.dark,font:c.bf,weight:900,anchor:'middle'});
  const lab=(o,x)=>{
    const al=wrap(o.a||'',colW,40,c.tf,700).slice(0,1),bl=wrap(o.b||'',colW,24,c.bf).slice(0,3),ly=top+photoH+58*k;
    return T(al,{x,y:ly,size:40,fill:c.col.ink,font:c.tf,weight:700})
      +(bl.length?T(bl,{x,y:ly+44,size:24,lh:1.55,fill:c.col.mute,font:c.bf}):'');
  };
  return s+lab(A,P)+lab(B,P+colW+gap);
}});

/* 人物引言：一張人像佔一側，另一側放金句與出處 */
def({id:'kPortrait',cat:'card',name:'圖卡・人物引言',hint:'1 張人像；標題放金句，副標題放出處',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,iw=wide?Math.round(W*.46):W,ih=wide?H:Math.round(H*.46);
  const tx=wide?iw+P*.7:P,tw0=W-tx-P,top=wide?P:ih+P*.7,bot=H-Math.max(P,footH()+20);
  const availH=Math.max(120,bot-top),marks=76;
  let qs=wide?74:62,ql=wrap(c.t.title,tw0,qs,c.tf,700);
  while(qs>34&&((ql.length>8)||(ql.length*qs*k*1.42>availH-marks-150))){qs-=4;ql=wrap(c.t.title,tw0,qs,c.tf,700)}
  ql=ql.slice(0,Math.max(1,Math.floor((availH-marks-150)/(qs*k*1.42))));
  const qh=(ql.length-1)*qs*k*1.42,total=marks+qh+150,y0=top+Math.max(0,(availH-total)/2)+marks;
  const markAt=(x,cy)=>`<circle cx="${f1(x+26)}" cy="${f1(cy)}" r="24"/><path d="M${f1(x+56)},${f1(cy)}C${f1(x+56)},${f1(cy+46)} ${f1(x+30)},${f1(cy+70)} ${f1(x)},${f1(cy+80)}L${f1(x-4)},${f1(cy+66)}C${f1(x+20)},${f1(cy+56)} ${f1(x+30)},${f1(cy+40)} ${f1(x+28)},${f1(cy+24)}Z"/>`;
  const mq=y0-qs*k*.85;
  let s=bg(c.col.paper||'#fff')+IMG(c.imgs[0],0,0,iw,ih)
   +`<g fill="${c.col.acc}" opacity=".55">${[0,62].map(dx=>`<g transform="rotate(180 ${f1(tx+26+dx)} ${f1(mq)})">${markAt(tx+dx,mq)}</g>`).join('')}</g>`
   +T(ql,{x:tx,y:y0,size:qs,lh:1.42,fill:c.col.ink,font:c.tf,weight:700});
  if(c.t.subtitle)s+=`<rect x="${f1(tx+2)}" y="${f1(y0+qh+40)}" width="72" height="5" rx="2.5" fill="${c.col.acc}"/>`
   +T(wrap(c.t.subtitle,tw0,28,c.bf,600).slice(0,2),{x:tx+2,y:y0+qh+102,size:28,lh:1.4,fill:c.col.mt,font:c.bf,weight:600,ls:2});
  return s;
}});

/* 中國風・撕紙分界：照片在一側，宣紙與直排標題在另一側 */
def({id:'cnTear',cat:'cn',name:'中國風・撕紙分界',hint:'1 張照片；標題直排在宣紙上',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,paper=c.col.paper||'#f4efe6',cut=wide?Math.round(W*.58):Math.round(H*.46);
  const pts=wide?tearPts(cut,0,cut,H,24,28,11):tearPts(0,cut,W,cut,24,28,11);
  const panel=wide?`M0,0L${TP2(pts)}L0,${H}Z`:`M0,0L${W},0L${TP2(pts.slice().reverse())}L0,0Z`;
  let s=IMG(c.imgs[0],0,0,W,H)
   /* 撕紙邊的內側暗線，讓紙的厚度看得出來 */
   +`<path d="M${TP2(pts)}" fill="none" stroke="${c.col.dark}" stroke-opacity=".18" stroke-width="5"/>`
   +`<path d="${panel}" fill="${paper}"/>`;
  /* 宣紙的極淡橫紋 */
  for(let i=1;i<=3;i++)s+=`<line x1="0" y1="${f1(wide?H*(.22*i):cut*.22*i)}" x2="${wide?cut:W}" y2="${f1(wide?H*(.22*i):cut*.22*i)}" stroke="${c.col.dark}" stroke-opacity=".045" stroke-width="2"/>`;
  const seal=(x,y,sz)=>`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(sz)}" height="${f1(sz)}" rx="${f1(sz*.12)}" fill="#b03a2e" opacity=".88"/><rect x="${f1(x+sz*.16)}" y="${f1(y+sz*.16)}" width="${f1(sz*.68)}" height="${f1(sz*.68)}" rx="${f1(sz*.06)}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>`;
  if(wide){
    const ch=[...String(c.t.title||'標題')],ts=Math.min(92,Math.floor((H-P*1.6)/Math.max(1,ch.length*1.1)));
    s+=VT(c.t.title,{x:cut-96,y:P+ts*.95,size:ts,gap:1.1,fill:c.col.ink,font:SERIF,weight:700})
     +`<line x1="${cut-176}" y1="${f1(P+60)}" x2="${cut-176}" y2="${f1(P+60+ch.length*ts*1.1)}" stroke="${c.col.dark}" stroke-opacity=".28" stroke-width="2"/>`
     +VT(c.t.subtitle,{x:cut-206,y:P+90,size:28,gap:1.2,fill:c.col.mute,font:c.bf})
     +seal(cut-186+8,P+76+ch.length*ts*1.1,64);
  }else{
    const ts=Math.min(84,Math.round(W*.085)),tl=wrap(c.t.title,W-2*P,ts,SERIF,700).slice(0,2);
    let sy=cut*.30;
    s+=T(tl,{x:P,y:sy+ts,size:ts,lh:1.25,fill:c.col.ink,font:SERIF,weight:700})
     +`<line x1="${P}" y1="${f1(sy+ts+34)}" x2="${P+96}" y2="${f1(sy+ts+34)}" stroke="${c.col.dark}" stroke-opacity=".3" stroke-width="3"/>`
     +T(wrap(c.t.subtitle,W-2*P,26,c.bf).slice(0,2),{x:P,y:sy+ts+92,size:26,lh:1.5,fill:c.col.mute,font:c.bf})
     +seal(W-P-64,sy+ts+40,60);
  }
  return s;
}});

/* 中國風・宣紙金句：直排金句＋落款＋印章，底色是淡墨暈染 */
def({id:'cnQuote',cat:'cn',name:'中國風・宣紙金句',hint:'不用圖片；標題直排當金句，副標題放出處',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,paper=c.col.paper||'#f4efe6',g=c.id();
  const quote=String(c.t.title||'留白，是為了讓重點被看見');
  const ch=[...quote],colW=Math.max(1,ch.length*1.1);
  const ts=Math.min(wide?92:74,Math.floor((H-P*1.8)/Math.max(1,ch.length*1.16)));
  const cx=wide?W*.62:W*.56,cy=P+ts*1.05;
  let s=bg(paper)+`<defs><radialGradient id="${g}" cx=".74" cy=".26" r=".72"><stop offset="0" stop-color="${c.col.dark}" stop-opacity=".11"/><stop offset="1" stop-color="${c.col.dark}" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`;
  s+=VT(quote,{x:cx,y:cy,size:ts,gap:1.16,fill:c.col.ink,font:SERIF,weight:700});
  const endY=cy+(ch.length-1)*ts*1.16;
  s+=`<line x1="${f1(cx-ts*0.9)}" y1="${f1(P+ts*.4)}" x2="${f1(cx-ts*0.9)}" y2="${f1(Math.min(H-P,endY+ts*.4))}" stroke="${c.col.dark}" stroke-opacity=".26" stroke-width="2"/>`;
  if(c.t.subtitle)s+=VT(c.t.subtitle,{x:cx-ts*1.45,y:P+90,size:28,gap:1.2,fill:c.col.mute,font:c.bf});
  s+=`<rect x="${f1(cx-32)}" y="${f1(Math.min(H-P-70,endY+56))}" width="62" height="62" rx="7" fill="#b03a2e" opacity=".88"/>`
   +`<rect x="${f1(cx-22)}" y="${f1(Math.min(H-P-60,endY+66))}" width="42" height="42" rx="4" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3"/>`;
  return s;
}});

/* 結尾感謝頁：大標＋一句話 */
def({id:'thanks',cat:'cover',name:'結尾・感謝頁',hint:'不用圖片；標題放感謝詞，副標題放一句話',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,t=c.t.title||'謝謝聆聽',sub=c.t.subtitle||'';
  let ts=Math.min(wide?170:132,Math.round(W*.088));
  while(ts>44&&tw(t,ts*k,c.tf,800)>W-2*P)ts-=6;
  const tot=ts*k*1.1+(sub?110:0)+40,y0=(H-tot)/2+ts*k*.82;
  let s=bg(c.col.paper||'#fff')+T([t],{x:W/2,y:y0,size:ts,fill:c.col.ink,font:c.tf,weight:800,anchor:'middle',ls:2})
   +`<rect x="${f1(W/2-42)}" y="${f1(y0+36)}" width="84" height="6" rx="3" fill="${c.col.acc}"/>`;
  if(sub)s+=T(wrap(sub,W-2*P,30,c.bf,500).slice(0,2),{x:W/2,y:y0+36+72,size:30,lh:1.4,fill:c.col.mute,font:c.bf,anchor:'middle',ls:3});
  return s;
}});
/* 去背主體：主體放在色塊上、標題在另一側；沒去背的照片自動裁成圓形 */
def({id:'cutoutCard',cat:'card',name:'圖卡・去背主體',hint:'1 張照片（去背過最好）；主體放色塊上、標題在另一側',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,im=c.imgs[0],g=c.id(),mid=Math.min(W,H);
  const blobX=wide?W*.60:W*.50,blobY=wide?H*.46:H*.38;
  let s=bg(c.col.paper||c.col.light)
    +`<circle cx="${f1(blobX)}" cy="${f1(blobY)}" r="${f1(mid*.38)}" fill="${c.col.main}" opacity=".14"/>`
    +`<circle cx="${f1(blobX)}" cy="${f1(blobY)}" r="${f1(mid*.30)}" fill="${c.col.main}" opacity=".12"/>`;
  const boxW=wide?W*.40:W*.76,boxH=wide?H*.58:H*.44,bx=wide?W*.42:(W-boxW)/2,by=wide?H*.13:H*.05;
  if(im){
    if(im.cutout)s+=IMG(im,bx,by,boxW,boxH);
    else{
      const r=Math.min(boxW,boxH)/2,cx=bx+boxW/2,cy=by+boxH/2;
      s+=`<defs><clipPath id="${g}"><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/></clipPath></defs>`
       +IMG(im,cx-r,cy-r,r*2,r*2,`clip-path="url(#${g})"`);
    }
  }
  const tw0=wide?W*.36:W-2*P;
  let ts=Math.min(wide?96:76,Math.round(W*.062));
  while(ts>34&&wrap(c.t.title,tw0,ts,c.tf,800).length>(wide?4:3))ts-=4;
  const tl=wrap(c.t.title,tw0,ts,c.tf,800).slice(0,wide?4:3),th=(tl.length-1)*ts*k*1.16;
  const anchor=wide?'start':'end',tx=wide?P:W-P;
  const bot=H-Math.max(P,footH()?footH()+22:0);
  const y0=wide?Math.round(H*.46-th/2):Math.round(bot-th-64);
  s+=T(tl,{x:tx,y:y0,size:ts,lh:1.16,fill:c.col.ink,font:c.tf,weight:800,anchor});
  if(c.t.subtitle)s+=`<rect x="${f1(wide?tx:W-P-72)}" y="${f1(y0+32)}" width="72" height="5" rx="2.5" fill="${c.col.acc}"/>`
   +T(wrap(c.t.subtitle,wide?tw0:W-2*P,28,c.bf,500).slice(0,2),{x:wide?tx:W-P,y:y0+90,size:28,lh:1.45,fill:c.col.mute,font:c.bf,anchor});
  return s;
}});
/* 雙色調：照片以主色增值壓暗，標題壓在下方漸層上（雜誌封面感） */
def({id:'duotone',cat:'cover',name:'封面・雙色調',hint:'1 張照片；照片用主色增值，標題放大字',ratios:ALLR,render(c){
  const P=PAD(),k=FS,wide=W>H,im=c.imgs[0],g=c.id(),bot=H-Math.max(P,footH()?footH()+26:0);
  let s=bg(c.col.main);
  if(im)s+=IMG({...im,blend:'multiply',op:.95},0,0,W,H);
  s+=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.dark}" stop-opacity="0"/><stop offset="1" stop-color="${c.col.dark}" stop-opacity=".85"/></linearGradient></defs>`
   +`<rect y="${f1(H*.48)}" width="${W}" height="${f1(H*.52)}" fill="url(#${g})"/>`;
  let ts=Math.min(wide?150:112,Math.round(W*.092));
  while(ts>38&&tw(c.t.title,W-2*P,ts,c.tf,800)>W-2*P)ts-=6;
  const tl=wrap(c.t.title,W-2*P,ts,c.tf,800).slice(0,wide?2:3),th=(tl.length-1)*ts*k*1.14;
  /* 由下往上排：副標 → 細線 → 標題，細線才不會壓到副標 */
  const ruleY=bot-(c.t.subtitle?30*k+30:36),y0=ruleY-38-th;
  s+=T(tl,{x:P,y:y0,size:ts,lh:1.14,fill:'#fff',font:c.tf,weight:800})
   +`<rect x="${f1(P)}" y="${f1(ruleY)}" width="86" height="6" rx="3" fill="${c.col.acc}"/>`;
  if(c.t.subtitle)s+=T(wrap(c.t.subtitle,W-2*P,30,c.bf,500).slice(0,2),{x:P,y:bot,size:30,lh:1.4,fill:'#fff',op:.88,font:c.bf,ls:2});
  return s;
}});
def({id:'wall',cat:'wall',name:'照片牆・大標疊字',hint:'2–6 張照片拼成一牆；標題疊在底部',ratios:ALLR,render(c){
  const k=FS,P=PAD(),n=Math.max(2,Math.min(6,c.imgs.length)),gap=Math.max(6,Math.round(Math.min(W,H)*.014));
  const LAY={
    2:[[0,0,1,.5],[0,.5,1,.5]],
    3:[[0,0,.6,1],[.6,0,.4,.5],[.6,.5,.4,.5]],
    4:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],
    5:[[0,0,1/3,.56],[1/3,0,1/3,.56],[2/3,0,1/3,.56],[0,.56,.5,.44],[.5,.56,.5,.44]],
    6:[[0,0,1/3,.5],[1/3,0,1/3,.5],[2/3,0,1/3,.5],[0,.5,1/3,.5],[1/3,.5,1/3,.5],[2/3,.5,1/3,.5]]
  }[n];
  const g=c.id(),band=H*.44,tSize=Math.min(96,Math.round(W*.078)),botPad=Math.max(P,footH()+26);
  let s=bg(c.col.paper||'#fff');
  for(let i=0;i<LAY.length;i++){const[x,y,w,hh]=LAY[i];
    s+=IMG(c.imgs[i%c.imgs.length],x*W+gap/2,y*H+gap/2,Math.max(1,w*W-gap),Math.max(1,hh*H-gap))}
  s+=`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.dark}" stop-opacity="0"/><stop offset="1" stop-color="${c.col.dark}" stop-opacity=".9"/></linearGradient></defs>`
   +`<rect y="${f1(H-band)}" width="${W}" height="${f1(band)}" fill="url(#${g})"/>`;
  const tl=wrap(c.t.title,W-2*P,tSize,c.tf,800).slice(0,2),last=H-botPad-(c.t.subtitle?46*k:0);
  s+=T(tl,{x:P,y:last-(tl.length-1)*tSize*k*1.15,size:tSize,lh:1.15,fill:'#fff',font:c.tf,weight:800});
  if(c.t.subtitle)s+=T([c.t.subtitle],{x:P,y:H-botPad,size:28,fill:'#fff',op:.85,font:c.bf});
  return s;
}});

def({id:'vertical',cat:'cn',name:'中國風・直排',hint:'1 張',render(c){
  const g=c.id(),title=[...String(c.t.title||'')],ts=Math.min(118,820/Math.max(1,title.length*1.1)),body=String(c.t.body||'').replace(/\s+/g,''),per=17;let cols='';
  for(let k=0;k*per<body.length&&k<9;k++)cols+=VT(body.slice(k*per,(k+1)*per),{x:1430-k*50,y:300,size:28,gap:1.3,fill:'#fff',op:.88,font:c.bf});
  return IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".72"/><stop offset=".62" stop-color="#000" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${g})"/>`
   +VT(c.t.title,{x:1710,y:170+ts*.85,size:ts,gap:1.1,fill:'#fff',font:c.tf,weight:700})
   +`<rect x="1686" y="${f1(170+title.length*ts*1.1+30)}" width="48" height="48" rx="6" fill="${c.col.main}"/>`
   +VT(c.t.subtitle,{x:1570,y:300,size:30,gap:1.15,fill:'#fff',op:.9,font:c.bf})
   +`<line x1="1505" y1="270" x2="1505" y2="860" stroke="#fff" stroke-opacity=".5"/>`+cols;
}});

def({id:'circles',cat:'shape',name:'圓形拼貼',hint:'多張循環（約 20 格）',render(c){
  const r=92,cx=1440,cy=540,sh=[];
  for(let j=-3;j<=3;j++)for(let i=-4;i<=4;i++){const x=cx+(i+(j&1)*.5)*176,y=cy+j*152;if(((x-cx)/450)**2+((y-cy)/430)**2<=1)sh.push({el:`<circle cx="${f1(x)}" cy="${y}" r="${r}"/>`,b:[x-r,y-r,2*r,2*r],x,y})}
  let rings=sh.map(s=>`<circle cx="${f1(s.x)}" cy="${s.y}" r="${r+7}" fill="#fff"/>`).join('');
  return bg(c.col.paper||c.col.light)+`<g filter="url(#${c.sh})">${rings}</g>`+mosaic(c,sh,{shadow:false})
   +stack(c,{x:150,cy:540,w:600,tSize:104,tColor:c.col.ink,sColor:c.col.mt});
}});

def({id:'ocean',cat:'cover',name:'大標題・漸層淡出',hint:'1 張；副標題放地點／日期，內文放一行說明',render(c){
  const g=c.id(),t=c.t.title||' ',size=Math.min(190,100*1500/Math.max(1,tw(t,100,c.tf,700))),dy=footH()?-58:0;
  return IMG(c.imgs[0],0,0,W,H)+`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.col.paper||'#fff'}" stop-opacity="0"/><stop offset=".7" stop-color="${c.col.paper||'#fff'}" stop-opacity=".95"/><stop offset="1" stop-color="${c.col.paper||'#fff'}"/></linearGradient></defs><rect y="420" width="${W}" height="660" fill="url(#${g})"/>`
   +`<text x="960" y="${880+dy}" font-size="${f1(size)}" font-family="${esc(c.tf)}" font-weight="700" fill="${c.col.dk?c.col.ink:c.col.main}" stroke="${c.col.paper||'#fff'}" stroke-width="10" paint-order="stroke" text-anchor="middle" letter-spacing="6">${esc(t)}</text>`
   +T([c.t.subtitle],{x:960,y:960+dy,size:28,fill:c.col.ink,op:.75,font:c.bf,anchor:'middle',ls:6})
   +`<line x1="560" y1="${950+dy}" x2="680" y2="${950+dy}" stroke="${c.col.dark}" stroke-opacity=".4"/><line x1="1240" y1="${950+dy}" x2="1360" y2="${950+dy}" stroke="${c.col.dark}" stroke-opacity=".4"/>`
   /* 內文＝副標下面的一行說明（地點、日期、一句話補充） */
   +(c.t.body?T(wrap(c.t.body,1240,26,c.bf).slice(0,2),{x:960,y:1018+dy,size:26,lh:1.55,fill:c.col.ink,op:.6,font:c.bf,anchor:'middle'}):'');
}});

def({id:'pixel',cat:'shape',name:'方塊溶解',hint:'1 張（人像很適合）',render(c){
  const m=c.id(),rnd=rng(7);let sq='',acc='';
  for(let col=0;col<6;col++)for(let row=0;row<14;row++){const x=520+col*80,y=row*80,p=(col+1)/7;
    if(rnd()<p){const v=Math.round(255*(.3+.7*rnd()));sq+=`<rect x="${x+4}" y="${y+4}" width="72" height="72" fill="rgb(${v},${v},${v})"/>`}
    else if(rnd()<.18)acc+=`<rect x="${x+4}" y="${y+4}" width="72" height="72" fill="${c.col.main}" opacity=".18"/>`}
  return bg(c.col.paper||'#fff')+`<defs><mask id="${m}" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect x="1000" width="920" height="${H}" fill="#fff"/>${sq}</mask></defs>`
   +acc+IMG(c.imgs[0],520,0,1400,H,`mask="url(#${m})"`)
   +T([String(c.t.subtitle||'').toUpperCase()],{x:90,y:1040,size:190,fill:c.col.mt,op:.09,font:'Arial Black,Arial',weight:900})
   +stack(c,{x:130,cy:500,w:420,tSize:110,tColor:c.col.main,sColor:c.col.dark,bSize:24});
}});

