/* ---------- 匯入既有 PPTX：解壓 → 讀每張投影片的文字框／表格／照片／備忘稿 → 判讀成頁面欄位 ---------- */
async function unzipBytes(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength),dec=new TextDecoder();
  let e=u8.length-22;while(e>=0&&dv.getUint32(e,true)!==0x06054b50)e--;
  if(e<0)throw new Error('不是有效的 PPTX 檔（讀不到 ZIP 目錄）');
  const files=new Map();let p=dv.getUint32(e+16,true);
  for(let i=0,n=dv.getUint16(e+10,true);i<n&&dv.getUint32(p,true)===0x02014b50;i++){
    const nl=dv.getUint16(p+28,true),name=dec.decode(u8.subarray(p+46,p+46+nl));
    files.set(name,{method:dv.getUint16(p+10,true),size:dv.getUint32(p+20,true),off:dv.getUint32(p+42,true)});
    p+=46+nl+dv.getUint16(p+30,true)+dv.getUint16(p+32,true);
  }
  const bytes=async name=>{const f=files.get(name);if(!f)return null;
    const st=f.off+30+dv.getUint16(f.off+26,true)+dv.getUint16(f.off+28,true),raw=u8.subarray(st,st+f.size);
    if(f.method===0)return raw;if(f.method!==8)throw new Error('PPTX 用了不支援的壓縮方式');
    return new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())};
  const xml=async name=>{const b=await bytes(name);return b?new DOMParser().parseFromString(dec.decode(b),'application/xml'):null};
  return{bytes,xml,has:n=>files.has(n)};
}
const kid=(el,n)=>el?[...el.children].find(c=>c.localName===n):undefined;
const allNS=(el,n)=>el?[...el.getElementsByTagNameNS('*',n)]:[];
const relAttr=(el,n)=>el?el.getAttributeNS(RELNS,n)||el.getAttribute('r:'+n):null;
function partPath(base,target){
  if(target.startsWith('/'))return target.slice(1);
  const ps=base.split('/');ps.pop();for(const s of target.split('/')){if(s==='..')ps.pop();else if(s&&s!=='.')ps.push(s)}return ps.join('/');
}
async function relsOf(z,part){
  const doc=await z.xml(part.replace(/[^/]+$/,'')+'_rels/'+part.split('/').pop()+'.rels'),m=new Map();
  for(const r of allNS(doc,'Relationship'))m.set(r.getAttribute('Id'),{type:(r.getAttribute('Type')||'').split('/').pop(),target:r.getAttribute('TargetMode')==='External'?null:partPath(part,r.getAttribute('Target')||'')});
  return m;
}
const boxOf=x=>{const o=kid(x,'off'),e=kid(x,'ext');return o&&e?{x:+o.getAttribute('x'),y:+o.getAttribute('y'),w:+e.getAttribute('cx'),h:+e.getAttribute('cy')}:null};
const phOf=el=>{const nv=[...el.children].find(c=>/^nv/.test(c.localName)),ph=nv&&allNS(nv,'ph')[0];return ph?{type:ph.getAttribute('type')||'body',idx:ph.getAttribute('idx')||''}:null};
function paraText(p){let s='';for(const c of p.children){if(c.localName==='r'||c.localName==='fld')s+=allNS(c,'t').map(t=>t.textContent).join('');else if(c.localName==='br')s+='\n'}return s}
function textOf(tx){
  const ps=allNS(tx,'p');
  const lines=ps.map(paraText).flatMap(s=>s.split('\n')).map(s=>s.replace(/\s+/g,' ').trim()).filter(Boolean);
  /* 段落層級與項目符號：清單框每一段是一個項目，縮排的段落是上一項的說明 */
  const paras=ps.map(p=>{const pr=kid(p,'pPr');return{t:paraText(p).replace(/\s+/g,' ').trim(),lvl:+(pr&&pr.getAttribute('lvl'))||0}}).filter(o=>o.t);
  const bul=ps.some(p=>{const pr=kid(p,'pPr');return!!(pr&&(kid(pr,'buChar')||kid(pr,'buAutoNum')))});
  let sz=0,bold=false;for(const r of [...allNS(tx,'rPr'),...allNS(tx,'defRPr')]){const v=+r.getAttribute('sz');if(v)sz=Math.max(sz,v/100);if(r.getAttribute('b')==='1')bold=true}
  return{lines,paras,bul,sz,bold};
}
/* 版面配置區沒寫位置時，從版面配置（layout）或母片（master）找同類型的位置 */
async function phBoxes(z,part,cache){
  if(cache.has(part))return cache.get(part);
  const m=new Map(),doc=await z.xml(part);
  for(const sp of allNS(doc,'sp')){const ph=phOf(sp),b=boxOf(kid(kid(sp,'spPr'),'xfrm'));if(ph&&b){m.set('t:'+ph.type,b);if(ph.idx)m.set('i:'+ph.idx,b)}}
  const up=[...(await relsOf(z,part)).values()].find(r=>r.type==='slideMaster');
  const parent=up?await phBoxes(z,up.target,cache):new Map();
  for(const[k,v]of parent)if(!m.has(k))m.set(k,v);
  cache.set(part,m);return m;
}
const PH_SZ={title:40,ctrTitle:44,subTitle:24,body:20};
async function readSlide(z,part,cache){
  const doc=await z.xml(part),rels=await relsOf(z,part),texts=[],tables=[],pics=[],charts=[];
  const layout=[...rels.values()].find(r=>r.type==='slideLayout'),phMap=layout?await phBoxes(z,layout.target,cache):new Map();
  /* 群組內的座標要換算回投影片座標 */
  const walk=(node,T)=>{for(const c of node.children){
    const ln=c.localName,map=b=>b&&{x:T.dx+b.x*T.sx,y:T.dy+b.y*T.sy,w:b.w*T.sx,h:b.h*T.sy};
    if(ln==='grpSp'){const x=kid(kid(c,'grpSpPr'),'xfrm'),b=boxOf(x),co=kid(x,'chOff'),ce=kid(x,'chExt');let N=T;
      if(b&&co&&ce){const sx=b.w/(+ce.getAttribute('cx')||b.w||1),sy=b.h/(+ce.getAttribute('cy')||b.h||1);
        N={sx:T.sx*sx,sy:T.sy*sy,dx:T.dx+T.sx*(b.x-+co.getAttribute('x')*sx),dy:T.dy+T.sy*(b.y-+co.getAttribute('y')*sy)}}
      walk(c,N)}
    else if(ln==='sp'){const tx=kid(c,'txBody');if(!tx)continue;const ph=phOf(c),t=textOf(tx);if(!t.lines.length)continue;
      const b=map(boxOf(kid(kid(c,'spPr'),'xfrm'))||(ph&&(phMap.get('i:'+ph.idx)||phMap.get('t:'+ph.type))));
      texts.push({...t,sz:t.sz||(ph&&PH_SZ[ph.type])||18,ph:ph&&ph.type,box:b})}
    else if(ln==='graphicFrame'){
      const ch=allNS(c,'chart').find(e=>relAttr(e,'id'));
      if(ch){const r=rels.get(relAttr(ch,'id'));charts.push({target:r&&r.target,box:map(boxOf(kid(c,'xfrm')))});continue}
      const tbl=allNS(c,'tbl')[0];if(!tbl)continue;
      tables.push({rows:allNS(tbl,'tr').map(tr=>allNS(tr,'tc').map(tc=>allNS(tc,'p').map(paraText).join(' ').replace(/\s+/g,' ').trim())),box:map(boxOf(kid(c,'xfrm')))})}
    else if(ln==='pic'){const id=relAttr(allNS(c,'blip')[0],'embed'),r=id&&rels.get(id),b=map(boxOf(kid(kid(c,'spPr'),'xfrm')));if(r&&r.target&&b)pics.push({target:r.target,box:b})}
    else if(ln==='AlternateContent'){const ch=kid(c,'Choice')||kid(c,'Fallback');if(ch)walk(ch,T)}
  }};
  const tree=allNS(doc,'spTree')[0];if(tree)walk(tree,{sx:1,sy:1,dx:0,dy:0});
  for(const ch of charts)Object.assign(ch,ch.target?await readChart(z,ch.target).catch(()=>null)||{}:{});
  let notes='';const nr=[...rels.values()].find(r=>r.type==='notesSlide');
  if(nr){const nd=await z.xml(nr.target);for(const sp of allNS(nd,'sp')){const ph=phOf(sp);if(ph&&ph.type==='body'){const tx=kid(sp,'txBody');notes=allNS(tx,'p').map(paraText).join('\n').replace(/\n{3,}/g,'\n\n').trim();break}}}
  return{texts,tables,pics,notes,charts:charts.filter(c=>c.rows),chartsFailed:charts.filter(c=>!c.rows).length};
}
/* PowerPoint 圖表：從圖表 XML 的快取值讀出類別、系列與數值，對應成直條／橫條／折線／環圈 */
async function readChart(z,part){
  const doc=await z.xml(part),pa=doc&&allNS(doc,'plotArea')[0];if(!pa)return null;
  const typ=[...pa.children].find(e=>/Chart$/.test(e.localName));if(!typ)return null;
  const kind=/pie|doughnut/i.test(typ.localName)?'cPie':/line|area|scatter|radar/i.test(typ.localName)?'cLine':(kid(typ,'barDir')?.getAttribute('val')==='bar'?'cHbar':'cBar');
  const pts=el=>{const m=new Map();for(const p of allNS(el,'pt'))m.set(+p.getAttribute('idx'),(kid(p,'v')?.textContent||'').trim());return m};
  const sers=allNS(typ,'ser').slice(0,4).map(s=>({name:allNS(kid(s,'tx'),'v').map(v=>v.textContent).join(' ').trim()||allNS(kid(s,'tx'),'t').map(v=>v.textContent).join('').trim(),cat:pts(kid(s,'cat')||kid(s,'xVal')),val:pts(kid(s,'val')||kid(s,'yVal'))}));
  if(!sers.length)return null;
  const n=Math.max(...sers.map(s=>Math.max(s.cat.size,s.val.size)));if(!n)return null;
  const rows=[['',...sers.map((s,i)=>s.name||'系列 '+(i+1))]];
  for(let i=0;i<n;i++)rows.push([sers[0].cat.get(i)||String(i+1),...sers.map(s=>s.val.get(i)??'')]);
  const ct=kid(allNS(doc,'chart')[0],'title');
  return{kind,rows,title:ct?allNS(ct,'t').map(t=>t.textContent).join('').trim():''};
}
/* 把一張投影片的文字框判讀成標題、副標、大數字、項目（同欄上下相疊的框合成一張卡片＝一個項目）、表格 */
function classifySlide(sl,i,W0,H0){
  const k=1920/W0,pt=W0/12700/1920;/* pt→1920 畫布 px 的倍率是 1/pt */
  const px=v=>v/pt;let T=sl.texts.map(t=>({...t,s:t.lines.join('\n'),fz:px(t.sz),x:t.box?t.box.x*k:0,y:t.box?t.box.y*k:i,w:t.box?t.box.w*k:1920,h:t.box?t.box.h*k:px(t.sz)*1.3*t.lines.length}));
  const HH=H0*k;
  /* 頁尾、頁碼、日期與太小的註記 */
  T=T.filter(t=>!['sldNum','ftr','dt','hdr'].includes(t.ph)&&!(t.fz<21&&(t.y>HH*.88||/^\d+$/.test(t.s)))&&t.fz>=14);
  const isNum=t=>/^\d{1,3}$/.test(t.s),big=T.find(t=>isNum(t)&&t.fz>=110),quote=T.some(t=>/^[“"”「『]$/.test(t.s)&&t.fz>=90);
  T=T.filter(t=>t!==big&&!/^[“"”「『]$/.test(t.s));
  const cand=T.filter(t=>!isNum(t));
  const title=cand.find(t=>t.ph==='title'||t.ph==='ctrTitle')||cand.reduce((m,t)=>!m||t.fz>m.fz+.5||(Math.abs(t.fz-m.fz)<=.5&&t.y<m.y)?t:m,null);
  let rest=T.filter(t=>t!==title);
  /* 副標：副標題版面配置區；否則是標題正下方、字較小的「單行」文字。內文／項目符號框永遠不是副標 */
  const isList=t=>t.ph==='body'||t.bul;
  const sub=rest.find(t=>t.ph==='subTitle')||(title&&rest.filter(t=>!isList(t)&&t.lines.length===1&&t.y>=title.y&&t.y<title.y+title.h+title.fz*2.2&&t.fz<title.fz*.85&&t.s.length>=6).sort((a,b)=>a.y-b.y)[0]);
  const kicker=title&&rest.find(t=>t.y+t.h<=title.y+4&&t.fz<=title.fz*.6&&t.s.length<=40);
  /* 去掉編號小圓標、箭頭等純符號框 */
  rest=rest.filter(t=>t!==sub&&t!==kicker&&!(isNum(t)&&t.fz<80)&&/[\p{L}\p{N}]/u.test(t.s));
  const p={title:title?title.lines.join(' '):'',subtitle:sub?sub.lines.join(' '):(kicker?kicker.lines.join(' '):''),body:'',items:'',number:big?big.s:'',notes:sl.notes};
  let tpl='',table=false;
  /* 有圖表時：其餘文字不多就整頁做成圖表頁；文字多就保留文字頁，圖表另外接一頁在後面 */
  const chartPage=sl.charts.length>0&&!sl.tables.length&&rest.reduce((a,t)=>a+t.s.length,0)<=80;
  const extra=sl.charts.length&&!chartPage?sl.charts.map(ch=>({title:p.title,subtitle:ch.title||'圖表',body:'',number:'',notes:'',tpl:ch.kind,
    items:ch.rows.map(r=>r.map(v=>String(v).replace(/[|｜]/g,'／')).join('|')).join('\n')})):[];
  if(sl.tables.length){
    const rows=sl.tables[0].rows.filter(r=>r.some(Boolean));p.items=rows.map(r=>r.map(c=>c.replace(/[|｜]/g,'／')).join('|')).join('\n');table=true;
    p.body=rest.map(t=>t.lines.join(' ')).join('\n');
  }else if(chartPage){
    /* 圖表頁：圖表資料放進項目、其餘文字當註記 */
    const ch=sl.charts[0];p.items=ch.rows.map(r=>r.map(v=>String(v).replace(/[|｜]/g,'／')).join('|')).join('\n');tpl=ch.kind;
    p.body=rest.map(t=>t.lines.join(' ')).join('\n');if(!p.title&&ch.title)p.title=ch.title;
  }else{
    /* 卡片：水平重疊、垂直相鄰、寬度相近的框連成一組；
       上方或左邊的短標籤（例如「痛點」「方案A」「Q5」「現況」）也併進旁邊那張卡片 */
    const n=rest.length,up=[...Array(n).keys()],f=a=>up[a]===a?a:(up[a]=f(up[a]));
    /* 標籤＝短、單行，而且字明顯比旁邊的內容小；同字級的短標題不算（否則相鄰兩欄會被串在一起） */
    const label=(t,o)=>t.s.length<=6&&t.lines.length===1&&t.fz<o.fz*.85;
    for(let a=0;a<n;a++)for(let b=0;b<n;b++){const A=rest[a],B=rest[b];if(a===b)continue;
      const mw=Math.min(A.w,B.w),ov=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x);
      if(B.y>=A.y+A.h*.5){const gap=B.y-(A.y+A.h),lab=label(A,B)||(isList(B)&&B.paras.length>=2&&!isList(A)&&A.lines.length===1&&A.s.length<=16);
        if(ov>mw*.5&&(lab||Math.max(A.w,B.w)/Math.max(1,mw)<2.6)&&gap<Math.max(16,lab?B.fz*1.6:Math.min(A.fz,B.fz)*.9))up[f(b)]=f(a)}
      else if(label(A,B)&&B.x>=A.x+A.w-4&&B.x-(A.x+A.w)<A.fz*3){const vo=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);if(vo>Math.min(A.h,B.h)*.5)up[f(a)]=f(b)}}
    const groups=new Map();rest.forEach((t,a)=>{const r=f(a);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(t)});
    const G=[...groups.values()].map(g=>g.sort((a,b)=>a.y-b.y)).map(g=>({g,x:Math.min(...g.map(t=>t.x)),y:Math.min(...g.map(t=>t.y)),h:Math.max(...g.map(t=>t.y+t.h))-Math.min(...g.map(t=>t.y))}));
    /* 由上而下、同一列由左而右 */
    G.sort((a,b)=>Math.abs(a.y-b.y)<Math.min(a.h,b.h)*.5+8?a.x-b.x:a.y-b.y);
    /* 句子接句子：前一句已有標點就直接接，否則補「；」 */
    const joinS=a=>a.reduce((s,x)=>!s?x:s+(/[。！？；：，、.!?;:,]$/.test(s)?'':'；')+x,'');
    const items=G.flatMap(({g})=>{
      /* 單獨一個清單框：每個第一層段落是一項，縮排段落接成該項的說明 */
      if(g.length===1&&isList(g[0])&&g[0].paras.length>=2){
        const out=[];for(const o of g[0].paras){if(o.lvl>0&&out.length){const l=out[out.length-1];l.b=joinS([l.b,o.t].filter(Boolean));l.one=false}else out.push({a:o.t,b:'',one:true})}
        return out;
      }
      /* 小標題＋清單框：小標題是項目，清單各段用「、」接成說明 */
      const L=g.find(t=>isList(t)&&t.paras.length>=2);
      if(L&&g.length>1)return[{a:g.filter(t=>t!==L).map(t=>t.lines.join(' ')).join('・'),b:L.paras.map(o=>o.t).join('、'),one:false}];
      const head=g.reduce((m,t)=>t.fz>m.fz+.5?t:m,g[0]);
      const isPre=t=>t!==head&&label(t,head)&&(t.y<head.y-2||t.x+t.w<=head.x+4);
      const pre=g.filter(isPre).map(t=>t.lines.join(' '));
      const desc=[...head.lines.slice(1),...g.filter(t=>t!==head&&!isPre(t)).flatMap(t=>t.lines)];
      return{a:(pre.length?pre.join('・')+'：':'')+head.lines[0],b:joinS(desc),one:g.length===1&&head.lines.length===1};
    });
    /* 標題本身以引號開頭、內容不多的頁也當引言頁；「— 某某」是出處，放副標 */
    const qTitle=/^[「“"『]/.test(p.title)&&items.length<=3;
    if(qTitle||quote){const by=items.findIndex(o=>/^[—―－-]{1,2}\s*\S/.test(o.a));if(by>=0){p.subtitle=items[by].a.replace(/^[—―－-]+\s*/,'');items.splice(by,1)}}
    /* 項目接成內文一行：大項本身已有「：」時改用全形空白，避免「A：B：C」 */
    const line=o=>o.b?o.a+(o.a.includes('：')?'　':'：')+o.b:o.a;
    /* 第一頁只有在內容少時才當封面；第一頁就是條列內容頁的簡報照一般規則 */
    if(i===0&&items.length<=2){p.body=items.map(line).slice(0,4).join('\n');tpl='split'}
    else if(quote||qTitle||(big&&items.length<=2)){p.body=items.map(line).join('\n');if(qTitle)tpl='tQuote'}
    else if(items.length<=2&&items.every(o=>o.one)&&items.reduce((s,o)=>s+o.a.length,0)>50)p.body=items.map(o=>o.a).join('\n');
    else{p.items=items.map(o=>(o.a+(o.b?'|'+o.b:'')).replace(/\n/g,' ')).join('\n');
      if(items.length>=2&&items.length<=8&&items.every(o=>o.b&&o.a.length<=16))tpl='tGrid'}
    if(quote)tpl='tQuote';
  }
  /* PowerPoint 表格保持表格（使用者可在「版型」改成圖表）；Markdown 的數字表格才自動變圖表 */
  return{...p,tpl:tpl||autoTpl(p,i,table,{chart:false}),extra};
}
const IMG_MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',bmp:'image/bmp',webp:'image/webp'};
/* 回傳頁面清單；withImages 時把投影片上的照片（占畫面 3% 以上）加入圖庫，同一張圖只加一次 */
async function pagesFromPptx(u8,{withImages=true,onStep}={}){
  const z=await unzipBytes(u8),pres=await z.xml('ppt/presentation.xml');if(!pres)throw new Error('這不是 PowerPoint 簡報檔');
  const prels=await relsOf(z,'ppt/presentation.xml'),sz=allNS(pres,'sldSz')[0],W0=+(sz&&sz.getAttribute('cx'))||12192000,H0=+(sz&&sz.getAttribute('cy'))||6858000;
  const ids=allNS(pres,'sldId').map(s=>prels.get(relAttr(s,'id'))).filter(r=>r&&r.target),cache=new Map(),media=new Map(),pages=[];let charts=0;
  for(let i=0;i<ids.length;i++){
    onStep&&onStep(i,ids.length);
    const sl=await readSlide(z,ids[i].target,cache);
    charts+=sl.chartsFailed;
    const p=classifySlide(sl,i,W0,H0),sel=[];
    if(withImages)for(const pic of sl.pics.filter(q=>q.box.w*q.box.h>=W0*H0*.03).sort((a,b)=>b.box.w*b.box.h-a.box.w*a.box.h).slice(0,6)){
      const ext=pic.target.split('.').pop().toLowerCase();if(!IMG_MIME[ext])continue;
      if(!media.has(pic.target)){let id=0;try{const b=new Blob([await z.bytes(pic.target)],{type:IMG_MIME[ext]}),bmp=await createImageBitmap(b);id=(await makeItem(pic.target.split('/').pop(),bmp)).id;if(bmp.close)bmp.close()}catch(e){console.warn('pptx image',pic.target,e)}media.set(pic.target,id)}
      const id=media.get(pic.target);if(id&&!sel.includes(id))sel.push(id);
    }
    const cp=cleanPage(p);cp.tpl=tplFor(cp.tpl);pages.push({...cp,sel});
    for(const x of p.extra||[]){const xp=cleanPage(x);xp.tpl=tplFor(xp.tpl);pages.push({...xp,sel:[]})}
  }
  return{pages,charts,images:[...media.values()].filter(Boolean).length};
}
async function importPptx(file,mode){
  try{
    toast('讀取 PPTX 中…');
    const r=await pagesFromPptx(new Uint8Array(await file.arrayBuffer()),{withImages:$('pptxImg').checked,onStep:(i,n)=>{if(i%10===0)toast(`讀取投影片… ${i+1}/${n}`)}});
    if(!r.pages.length){toast('這份簡報沒有投影片');return}
    storePage();
    if(mode==='replace'){if(S.pages.length>1&&!confirm(`用這份簡報的 ${r.pages.length} 頁取代目前的 ${S.pages.length} 頁？（可按復原）`))return;S.pages=r.pages.slice(0,MAXPAGES);usePage(0)}
    else{const at=S.pages.length;S.pages.push(...r.pages.slice(0,MAXPAGES-at));usePage(at)}
    const nn=r.pages.filter(p=>p.notes.trim()).length;
    pageChanged(`已匯入 ${r.pages.length} 頁（${nn} 頁有逐字稿${r.images?`、${r.images} 張照片`:''}${r.charts?`；${r.charts} 個圖表無法轉換，請另外處理`:''}）`);
  }catch(e){console.error(e);toast('PPTX 讀取失敗：'+e.message)}
}
{let pmode='replace';
  $('pptxReplace').onclick=()=>{pmode='replace';$('pptxFile').click()};
  $('pptxAppend').onclick=()=>{pmode='append';$('pptxFile').click()};
  $('pptxFile').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)importPptx(f,pmode)};}

