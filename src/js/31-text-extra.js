/* ---------- 進階純文字商務版型：文字・雙欄對比、文字・流程步驟（不需要照片，任何尺寸都能用） ---------- */
const lumOf=hex=>{const[r,g,b]=hex2rgb(hex);return(r*299+g*587+b*114)/1000};

/* 文字・雙欄對比：2 項時做兩張大卡片＋VS 圓標；3 項以上第一行當左右欄標題、其餘為對照列 */
def({id:'tCompare',cat:'cmp',name:'文字・雙欄對比',hint:'不用照片；2 項時做左右卡片對比，3 項以上第一行當左右欄標題、其餘為對照列',ratios:ALLR,render(c){
  const P=PAD(),k=FS,h=hdr(c,{tMax:60}),it=items(c).slice(0,10),wide=W>H;
  const bot=H-Math.max(P*.75,footH()?footH()+24:0),top=h.y;
  const cardBg=c.col.dk?'rgba(255,255,255,.07)':'#ffffff',border=c.col.dk?'rgba(255,255,255,.16)':c.col.light;
  const accInk=lumOf(c.col.acc)>150?c.col.dark:'#ffffff';
  let s=bg(c.col.paper||(c.col.dk?c.col.dark:c.col.light))+h.s;

  if(it.length<=2){
    const A=it[0]||{a:'方案 A',b:'',c:''},B=it[1]||{a:'方案 B',b:'',c:''};
    const gap=wide?48:32;
    const boxes=wide?strip(P,W-P,2,gap).map(([a,b])=>({x:a,y:top,w:b-a,h:bot-top}))
      :[0,1].map(i=>({x:P,y:top+i*((bot-top-gap)/2+gap),w:W-2*P,h:(bot-top-gap)/2}));
    [A,B].forEach((o,i)=>{
      const b=boxes[i],bar=i?c.col.acc:c.col.main,cid=c.id(),inP=wide?44:32,iw=b.w-2*inP;
      const body=[o.b,o.c].filter(Boolean).join('　');
      let ts=wide?44:36,tl=wrap(o.a||'',iw,ts,c.tf,700);
      while(ts>24&&tl.length>2){ts-=2;tl=wrap(o.a||'',iw,ts,c.tf,700)}
      tl=tl.slice(0,2);
      const tH=tl.length*ts*k*1.25;
      let bs=wide?26:23,bl=body?wrap(body,iw,bs,c.bf):[];
      const room=Math.max(60,b.h-inP*2-tH-48);
      while(bs>16&&bl.length*bs*k*1.6>room){bs-=1;bl=wrap(body,iw,bs,c.bf)}
      const maxB=Math.max(0,Math.floor(room/(bs*k*1.6)));
      bl=bl.slice(0,maxB);
      const totH=tH+34+(bl.length?bl.length*bs*k*1.6+12:0);
      const y0=b.y+12+Math.max(inP,(b.h-12-totH)/2);
      s+=`<defs><clipPath id="${cid}"><rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="20"/></clipPath></defs>`
       +`<rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="${f1(b.h)}" rx="20" fill="${cardBg}" stroke="${border}" stroke-width="2" filter="url(#${c.sh})"/>`
       +`<g clip-path="url(#${cid})"><rect x="${f1(b.x)}" y="${f1(b.y)}" width="${f1(b.w)}" height="12" fill="${bar}"/></g>`
       +T(tl,{x:b.x+inP,y:y0+ts*k*.85,size:ts,lh:1.25,fill:c.col.ink,font:c.tf,weight:700})
       +`<rect x="${f1(b.x+inP)}" y="${f1(y0+tH+12)}" width="64" height="5" rx="2.5" fill="${bar}"/>`;
      if(bl.length)s+=T(bl,{x:b.x+inP,y:y0+tH+40+bs*k*.85,size:bs,lh:1.6,fill:c.col.mute,font:c.bf});
    });
    const vr=wide?42:34,vx=W/2,vy=wide?top+(bot-top)/2:top+(bot-top-gap)/2+gap/2;
    s+=`<circle cx="${f1(vx)}" cy="${f1(vy)}" r="${vr}" fill="${c.col.acc}" stroke="${c.col.paper||c.col.light}" stroke-width="6"/>`
     +T(['VS'],{x:vx,y:vy+vr*.34,size:f1(vr*.86),fill:accInk,font:c.bf,weight:900,anchor:'middle',fixed:true});
    return s;
  }

  /* 3 項以上：雙欄卡片對照表 */
  const hasRight=!!it[0].b;
  const headA=hasRight?(it[0].a||'方案 A'):'方案 A',headB=hasRight?(it[0].b||'方案 B'):'方案 B';
  const rows=hasRight?it.slice(1).map(r=>[r.a||'',[r.b,r.c].filter(Boolean).join('　')])
    :(()=>{const half=Math.ceil(it.length/2);return[...Array(half)].map((_,i)=>{
      const L=it[i],R=it[i+half];
      return[L?[L.a,L.b,L.c].filter(Boolean).join('：'):'',R?[R.a,R.b,R.c].filter(Boolean).join('：'):''];
    })})();
  const gap=wide?40:22,cols=strip(P,W-P,2,gap),colW=cols[0][1]-cols[0][0],cardH=bot-top;
  const inP=wide?34:22,iw=colW-2*inP,hh=wide?76*k:64*k,avail=cardH-hh-24;
  let hs=wide?32:26;
  while(hs>18&&(tw(headA,hs*k,c.tf,700)>iw||tw(headB,hs*k,c.tf,700)>iw))hs-=2;
  let sz=wide?26:21,L=[];
  const measure=s0=>rows.map(([a,b])=>{const la=a?wrap(a,iw,s0,c.bf):[],lb=b?wrap(b,iw,s0,c.bf):[];return{la,lb,h:Math.max(1,la.length,lb.length)*s0*k*1.45+s0*k*.9}});
  L=measure(sz);
  while(sz>15&&L.reduce((a,r)=>a+r.h,0)>avail){sz-=1;L=measure(sz)}
  const nat=L.reduce((a,r)=>a+r.h,0),scaleH=nat>0&&nat<avail*.88?Math.min(1.8,avail*.88/nat):1;
  [0,1].forEach(ci=>{
    const[x]=cols[ci],cid=c.id(),bar=ci?c.col.acc:c.col.main,hFill=ci?accInk:'#ffffff',hTxt=ci?headB:headA;
    s+=`<defs><clipPath id="${cid}"><rect x="${f1(x)}" y="${f1(top)}" width="${f1(colW)}" height="${f1(cardH)}" rx="18"/></clipPath></defs>`
     +`<rect x="${f1(x)}" y="${f1(top)}" width="${f1(colW)}" height="${f1(cardH)}" rx="18" fill="${cardBg}" stroke="${border}" stroke-width="2" filter="url(#${c.sh})"/>`
     +`<g clip-path="url(#${cid})"><rect x="${f1(x)}" y="${f1(top)}" width="${f1(colW)}" height="${f1(hh)}" fill="${bar}"/></g>`
     +T(wrap(hTxt,iw,hs,c.tf,700).slice(0,1),{x:x+inP,y:top+hh/2+hs*k*.34,size:hs,fill:hFill,font:c.tf,weight:700});
    let y=top+hh+12;
    for(let ri=0;ri<L.length;ri++){
      const rh=L[ri].h*scaleH;if(y+rh>top+cardH-4)break;
      const lines=ci?L[ri].lb:L[ri].la,th=lines.length*sz*k*1.45;
      if(ri)s+=`<line x1="${f1(x+inP)}" y1="${f1(y)}" x2="${f1(x+colW-inP)}" y2="${f1(y)}" stroke="${border}" stroke-width="1.5"/>`;
      if(lines.length)s+=T(lines,{x:x+inP,y:y+(rh-th)/2+sz*k*.85,size:sz,lh:1.45,fill:c.col.ink,font:c.bf});
      y+=rh;
    }
  });
  return s;
}});

/* 文字・流程步驟：不用照片；項目填「步驟|說明」或「時間|步驟|說明」，2–6 步自動橫排／直排 */
def({id:'tSteps',cat:'biz',name:'文字・流程步驟',hint:'不用照片；項目填「步驟|說明」或「時間|步驟|說明」，2–6 步自動橫排／直排',maxItems:6,ratios:ALLR,render(c){
  const P=PAD(),k=FS,h=hdr(c,{tMax:60}),it=items(c).slice(0,6),n=Math.max(1,it.length),wide=W>H;
  const bot=H-Math.max(P*.75,footH()?footH()+24:0),top=h.y;
  const hasTag=it.some(o=>o.c),steps=it.map(o=>({tag:hasTag?o.a:'',title:hasTag?(o.b||o.a):o.a,desc:hasTag?o.c:o.b}));
  const accInk=lumOf(c.col.acc)>150?c.col.dark:'#ffffff',lineCol=c.col.dk?'rgba(255,255,255,.22)':c.col.soft;
  let s=bg(c.col.paper||'#ffffff')+h.s;

  if(wide){
    const gap=Math.max(20,44-n*4),cols=strip(P,W-P,n,gap),colW=cols[0][1]-cols[0][0],r=Math.min(46,Math.max(28,Math.round(colW*.22)));
    const tagH=hasTag?40*k:0,avail=bot-top;
    let ts=32,ds=22;
    const lay=(ts0,ds0)=>steps.map(st=>{
      const tg=st.tag?wrap(st.tag,colW,20,c.bf,700).slice(0,1):[];
      const tl=wrap(st.title,colW,ts0,c.tf,700).slice(0,2);
      const dl=st.desc?wrap(st.desc,colW,ds0,c.bf).slice(0,5):[];
      const h0=tagH+2*r+36+tl.length*ts0*k*1.22+22+(dl.length?dl.length*ds0*k*1.55:0);
      return{tg,tl,dl,h0};
    });
    let L=lay(ts,ds);
    while((ts>20||ds>15)&&Math.max(...L.map(x=>x.h0))>avail){if(ts>20)ts-=2;if(ds>15)ds-=1;L=lay(ts,ds)}
    const maxH=Math.max(...L.map(x=>x.h0)),yStart=top+Math.max(0,(avail-maxH)*.42),cy=yStart+tagH+r;
    if(n>1){
      const xA=(cols[0][0]+cols[0][1])/2,xB=(cols[n-1][0]+cols[n-1][1])/2;
      s+=`<line x1="${f1(xA)}" y1="${f1(cy)}" x2="${f1(xB)}" y2="${f1(cy)}" stroke="${lineCol}" stroke-width="6" stroke-linecap="round"/>`;
    }
    cols.forEach(([a,b],i)=>{
      const xc=(a+b)/2,last=i===n-1,fill=last?c.col.acc:c.col.main,txtFill=last?accInk:'#ffffff',st=L[i];
      if(st.tg.length)s+=T(st.tg,{x:xc,y:cy-r-18,size:20,fill:c.col.mt,font:c.bf,weight:700,anchor:'middle',ls:1});
      s+=`<circle cx="${f1(xc)}" cy="${f1(cy)}" r="${r}" fill="${fill}" stroke="${c.col.paper||'#fff'}" stroke-width="5"/>`
       +T([pad2(i)],{x:xc,y:cy+r*.28,size:f1(r*.72),fill:txtFill,font:c.tf,weight:800,anchor:'middle',fixed:true});
      const ty=cy+r+34+ts*k*.82;
      s+=T(st.tl,{x:xc,y:ty,size:ts,lh:1.22,fill:c.col.ink,font:c.tf,weight:700,anchor:'middle'});
      const ruleY=ty+(st.tl.length-1)*ts*k*1.22+ts*k*.4+10;
      s+=`<rect x="${f1(xc-18)}" y="${f1(ruleY)}" width="36" height="4" rx="2" fill="${last?c.col.main:c.col.acc}"/>`;
      if(st.dl.length)s+=T(st.dl,{x:xc,y:ruleY+20+ds*k*.85,size:ds,lh:1.55,fill:c.col.mute,font:c.bf,anchor:'middle'});
    });
    return s;
  }

  /* 直式／方形：垂直步驟軸 */
  const avail=bot-top,r=Math.min(36,Math.max(22,Math.round(avail/(n*4.2)))),cx=P+r,tx=cx+r+30,tw0=W-P-tx;
  let ts=34,ds=24,rg=26;
  const lay=(ts0,ds0,g0)=>steps.map(st=>{
    const tl=wrap((st.tag?st.tag+' · ':'')+st.title,tw0,ts0,c.tf,700).slice(0,2);
    const dl=st.desc?wrap(st.desc,tw0,ds0,c.bf).slice(0,4):[];
    const bh=Math.max(2*r,tl.length*ts0*k*1.22+(dl.length?10+dl.length*ds0*k*1.5:0));
    return{tl,dl,bh,stepH:bh+g0};
  });
  let L=lay(ts,ds,rg);
  while((ts>20||ds>16||rg>14)&&L.reduce((a,x)=>a+x.stepH,0)-rg>avail){
    if(ts>20)ts-=2;if(ds>16)ds-=1;if(rg>14)rg-=2;L=lay(ts,ds,rg);
  }
  const tot=L.reduce((a,x)=>a+x.stepH,0)-rg;
  let y=top+Math.max(0,(avail-tot)*.42);
  const cys=L.map(x=>{const cy=y+r;y+=x.stepH;return cy});
  if(n>1)s+=`<line x1="${f1(cx)}" y1="${f1(cys[0])}" x2="${f1(cx)}" y2="${f1(cys[n-1])}" stroke="${lineCol}" stroke-width="5" stroke-linecap="round"/>`;
  L.forEach((st,i)=>{
    const cy=cys[i],last=i===n-1,fill=last?c.col.acc:c.col.main,txtFill=last?accInk:'#ffffff';
    s+=`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="${fill}" stroke="${c.col.paper||'#fff'}" stroke-width="4"/>`
     +T([pad2(i)],{x:cx,y:cy+r*.28,size:f1(r*.72),fill:txtFill,font:c.tf,weight:800,anchor:'middle',fixed:true});
    const ty=cy-r+ts*k*.85;
    s+=T(st.tl,{x:tx,y:ty,size:ts,lh:1.22,fill:c.col.ink,font:c.tf,weight:700});
    if(st.dl.length)s+=T(st.dl,{x:tx,y:ty+(st.tl.length-1)*ts*k*1.22+ts*k*.4+10+ds*k*.85,size:ds,lh:1.5,fill:c.col.mute,font:c.bf});
  });
  return s;
}});
