/* ---------- PPTX：每頁＝一張不含文字的底圖＋可編輯文字框（沿用上面的 ZIP） ---------- */
const EMU=6350;/* 1920px 寬 = 13.333in = 12192000 EMU；1px = 0.5pt */
const xesc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'');
const NS='xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const XH='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const RELNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const rels=list=>XH+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${list.map(([id,type,target])=>`<Relationship Id="${id}" Type="${RELNS}/${type}" Target="${target}"/>`).join('')}</Relationships>`;
function pColor(fill,op){
  let hex='000000',a=1;const f=String(fill||'').trim();
  let m=f.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if(m)hex=(m[1].length===3?[...m[1]].map(c=>c+c).join(''):m[1]).toUpperCase();
  else if((m=f.match(/^rgba?\(([^)]+)\)/i))){const v=m[1].split(',').map(s=>parseFloat(s));hex=v.slice(0,3).map(n=>Math.round(n).toString(16).padStart(2,'0')).join('').toUpperCase();if(v.length>3)a=v[3]}
  a*=op??1;
  return `<a:solidFill><a:srgbClr val="${hex}">${a<.995?`<a:alpha val="${Math.round(a*100000)}"/>`:''}</a:srgbClr></a:solidFill>`;
}
const firstFont=f=>String(f||'').split(',')[0].replace(/['"]/g,'').trim()||'Microsoft JhengHei';
function textSp(r,id){
  const face=xesc(firstFont(r.font)),sz=Math.max(100,Math.round(r.size*50)),b=r.weight>=600?' b="1"':'';
  const shadow=r.shadow?'<a:effectLst><a:outerShdw blurRad="63500" dist="12700" dir="5400000" algn="t" rotWithShape="0"><a:srgbClr val="000000"><a:alpha val="55000"/></a:srgbClr></a:outerShdw></a:effectLst>':'';
  let x,y,w,h,algn='l',vert='',lnPt,spc=Math.round((r.ls||0)*50);
  if(r.vertical){
    w=r.size*1.5;h=[...r.lines[0]].length*r.size*r.gap+r.size*.4;x=r.x-w/2;y=r.y-r.size*.95;vert=' vert="eaVert"';
    spc=Math.round((r.gap-1)*r.size*50);lnPt=r.size*.5*1.2;
  }else{
    const L=r.size*(r.lines.length>1?r.lh:1.2);lnPt=L*.5;
    const mw=Math.max(...r.lines.map(l=>tw(l,r.size,r.font,r.weight)+(r.ls||0)*[...l].length));
    w=mw+r.size*.6;h=L*r.lines.length+r.size*.2;
    x=r.anchor==='middle'?r.x-w/2:r.anchor==='end'?r.x-w:r.x;algn=r.anchor==='middle'?'ctr':r.anchor==='end'?'r':'l';
    /* 以 PowerPoint 固定行高時，第一行基線約在行高的 0.8 處 */
    y=r.y-L*.8;
  }
  const rPr=`<a:rPr lang="zh-TW" altLang="en-US" sz="${sz}"${b} spc="${spc}" dirty="0">${pColor(r.fill,r.op)}${shadow}<a:latin typeface="${face}"/><a:ea typeface="${face}"/><a:cs typeface="${face}"/></a:rPr>`;
  const pPr=`<a:pPr algn="${algn}"><a:lnSpc><a:spcPts val="${Math.round(lnPt*100)}"/></a:lnSpc></a:pPr>`;
  /* 「整段」模式：斷好的行接回同一段、由 PowerPoint 自動換行，改字時會重排；空行仍是段落分隔 */
  const flow=S.pptText==='flow'&&!r.vertical&&r.lines.length>1;
  let lines=r.lines;
  if(flow){lines=[];let cur=null;for(const l of r.lines){if(!l.trim()){if(cur!==null)lines.push(cur);cur=null;lines.push('');continue}
      /* 斷行處原本是空格（英數字結尾才會在空格處斷行，例如「2026 品牌提案」），接回時補回 */
      cur=cur===null?l:cur+(/[A-Za-z0-9]$/.test(cur)?' ':'')+l}
    if(cur!==null)lines.push(cur);
    /* 框稍微放寬，避免 PowerPoint 的字寬略大時多斷一行；置中／靠右的框要跟著平移 */
    const dw=w*.03+r.size*.2;w+=dw;if(r.anchor==='middle')x-=dw/2;else if(r.anchor==='end')x-=dw}
  const paras=lines.map(l=>l.trim()?`<a:p>${pPr}<a:r>${rPr}<a:t>${xesc(l)}</a:t></a:r></a:p>`:`<a:p>${pPr}<a:endParaRPr lang="zh-TW" sz="${sz}" dirty="0"/></a:p>`).join('');
  const E=v=>Math.round(v*EMU);
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="文字 ${id-2}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${E(x)}" y="${E(y)}"/><a:ext cx="${E(w)}" cy="${E(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>`+
    `<p:txBody><a:bodyPr wrap="${flow?'square':'none'}" lIns="0" tIns="0" rIns="0" bIns="0" anchor="t"${vert}><a:noAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`;
}
function slideXml(texts){
  const pic=`<p:pic><p:nvPicPr><p:cNvPr id="2" name="版面底圖"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${W*EMU}" cy="${H*EMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  return XH+`<p:sld ${NS}><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${pic}${texts.map((t,i)=>textSp(t,i+3)).join('')}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
const GRP0='<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>';
const SPTREE0=`<p:spTree>${GRP0}</p:spTree>`;
const CLRMAP='<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>';
/* 備忘稿：一份備忘稿母片（上半投影片縮圖、下半逐字稿），每頁有逐字稿才產生該頁的備忘稿 */
const notesPh=(id,name,ph,xfrm,extra='')=>`<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"${ph.includes('sldImg')?' noRot="1" noChangeAspect="1"':''}/></p:cNvSpPr><p:nvPr>${ph}</p:nvPr></p:nvSpPr><p:spPr>${xfrm}</p:spPr>${extra}</p:sp>`;
const NOTES_MASTER=XH+`<p:notesMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>${GRP0}`+
  notesPh(2,'投影片圖片版面配置區 1','<p:ph type="sldImg" idx="2"/>','<a:xfrm><a:off x="685800" y="1143000"/><a:ext cx="5486400" cy="3086100"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln w="12700"><a:solidFill><a:prstClr val="black"/></a:solidFill></a:ln>')+
  notesPh(3,'備忘稿版面配置區 2','<p:ph type="body" sz="quarter" idx="3"/>','<a:xfrm><a:off x="685800" y="4400550"/><a:ext cx="5486400" cy="3600450"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
    '<p:txBody><a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="zh-TW" altLang="en-US"/><a:t>按一下以編輯母片文字樣式</a:t></a:r></a:p></p:txBody>')+
  `</p:spTree></p:cSld>${CLRMAP}<p:notesStyle><a:lvl1pPr marL="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1200" kern="1200"><a:solidFill><a:schemeClr val="tx1"/></a:solidFill><a:latin typeface="+mn-lt"/><a:ea typeface="+mn-ea"/><a:cs typeface="+mn-cs"/></a:defRPr></a:lvl1pPr></p:notesStyle></p:notesMaster>`;
function notesXml(text){
  const paras=String(text).replace(/\r\n?/g,'\n').split('\n').map(l=>l?`<a:p><a:r><a:rPr lang="zh-TW" altLang="en-US" dirty="0"/><a:t>${xesc(l)}</a:t></a:r></a:p>`:'<a:p><a:endParaRPr lang="zh-TW" altLang="en-US" dirty="0"/></a:p>').join('');
  return XH+`<p:notes ${NS}><p:cSld><p:spTree>${GRP0}`+notesPh(2,'投影片圖片版面配置區 1','<p:ph type="sldImg"/>','')+
    notesPh(3,'備忘稿版面配置區 2','<p:ph type="body" idx="1"/>','',`<p:txBody><a:bodyPr/><a:lstStyle/>${paras}</p:txBody>`)+
    '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>';
}
const THEME_XML=XH+'<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office"><a:themeElements><a:clrScheme name="Office"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>'+
  ['4472C4','ED7D31','A5A5A5','FFC000','5B9BD5','70AD47'].map((c,i)=>`<a:accent${i+1}><a:srgbClr val="${c}"/></a:accent${i+1}>`).join('')+'<a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>'+
  '<a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface="Microsoft JhengHei"/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft JhengHei"/><a:cs typeface=""/></a:minorFont></a:fontScheme>'+
  '<a:fmtScheme name="Office"><a:fillStyleLst>'+'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)+'</a:fillStyleLst><a:lnStyleLst>'+'<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'.repeat(3)+
  '</a:lnStyleLst><a:effectStyleLst>'+'<a:effectStyle><a:effectLst/></a:effectStyle>'.repeat(3)+'</a:effectStyleLst><a:bgFillStyleLst>'+'<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'.repeat(3)+'</a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>';
async function buildPptx(tpls,imgs,onStep){
  const enc=new TextEncoder(),files=[],add=(name,str)=>files.push({name,data:typeof str==='string'?enc.encode(str):str});
  const slides=[];
  for(let i=0;i<tpls.length;i++){
    /* 每頁可以是範本本身，或 {tpl,imgs,ov,notes}（整份簡報／連續編號用：換文字、圖片與逐字稿） */
    const pg=tpls[i].tpl?tpls[i]:{tpl:tpls[i],imgs,ov:null};
    onStep&&onStep(i,pg.tpl);
    /* 「轉成圖片」時不收集文字，文字直接畫進底圖 */
    const editable=S.pptText!=='image';COLLECT=editable?[]:null;let svg,texts;
    try{svg=withState(pg.ov,()=>renderSVG(pg.tpl,pg.imgs||imgs,'p'+i+'_'))}finally{texts=COLLECT||[];COLLECT=null}
    const jpg=await rasterizeSVG(svg,S.pptQ==='small'?1:2,'image/jpeg');
    slides.push({xml:slideXml(texts),img:new Uint8Array(await jpg.arrayBuffer()),notes:String(pg.notes||'').trim()?String(pg.notes).replace(/\s+$/,''):''});
    await new Promise(r=>setTimeout(r,0));
  }
  const n=slides.length,hasNotes=slides.some(s=>s.notes);
  add('[Content_Types].xml',XH+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/>'+
    '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>'+
    slides.map((_,i)=>`<Override PartName="/ppt/slides/slide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')+
    (hasNotes?'<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/><Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>'+
      slides.map((s,i)=>s.notes?`<Override PartName="/ppt/notesSlides/notesSlide${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>`:'').join(''):'')+
    '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>'+
    '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>'+
    '<Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  add('_rels/.rels',XH+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');
  add('docProps/core.xml',XH+`<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xesc(S.title||'排版')}</dc:title><dc:creator>圖片排版產生器</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  add('docProps/app.xml',XH+`<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>圖片排版產生器</Application><Slides>${n}</Slides></Properties>`);
  add('ppt/presentation.xml',XH+`<p:presentation ${NS} saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>${hasNotes?'<p:notesMasterIdLst><p:notesMasterId r:id="rId5"/></p:notesMasterIdLst>':''}<p:sldIdLst>${slides.map((_,i)=>`<p:sldId id="${256+i}" r:id="rId${i+10}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${W*EMU}" cy="${H*EMU}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  add('ppt/_rels/presentation.xml.rels',rels([['rId1','slideMaster','slideMasters/slideMaster1.xml'],['rId2','theme','theme/theme1.xml'],['rId3','presProps','presProps.xml'],['rId4','tableStyles','tableStyles.xml'],...(hasNotes?[['rId5','notesMaster','notesMasters/notesMaster1.xml']]:[]),...slides.map((_,i)=>[`rId${i+10}`,'slide',`slides/slide${i+1}.xml`])]));
  add('ppt/presProps.xml',XH+`<p:presentationPr ${NS}/>`);
  add('ppt/tableStyles.xml',XH+'<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>');
  add('ppt/theme/theme1.xml',THEME_XML);
  add('ppt/slideMasters/slideMaster1.xml',XH+`<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg>${SPTREE0}</p:cSld>${CLRMAP}<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`);
  add('ppt/slideMasters/_rels/slideMaster1.xml.rels',rels([['rId1','slideLayout','../slideLayouts/slideLayout1.xml'],['rId2','theme','../theme/theme1.xml']]));
  add('ppt/slideLayouts/slideLayout1.xml',XH+`<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="空白">${SPTREE0}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
  add('ppt/slideLayouts/_rels/slideLayout1.xml.rels',rels([['rId1','slideMaster','../slideMasters/slideMaster1.xml']]));
  if(hasNotes){
    add('ppt/theme/theme2.xml',THEME_XML);
    add('ppt/notesMasters/notesMaster1.xml',NOTES_MASTER);
    add('ppt/notesMasters/_rels/notesMaster1.xml.rels',rels([['rId1','theme','../theme/theme2.xml']]));
  }
  slides.forEach((s,i)=>{
    add(`ppt/slides/slide${i+1}.xml`,s.xml);
    add(`ppt/slides/_rels/slide${i+1}.xml.rels`,rels([['rId1','slideLayout','../slideLayouts/slideLayout1.xml'],['rId2','image',`../media/image${i+1}.jpeg`],...(s.notes?[['rId3','notesSlide',`../notesSlides/notesSlide${i+1}.xml`]]:[])]));
    add(`ppt/media/image${i+1}.jpeg`,s.img);
    if(s.notes){
      add(`ppt/notesSlides/notesSlide${i+1}.xml`,notesXml(s.notes));
      add(`ppt/notesSlides/_rels/notesSlide${i+1}.xml.rels`,rels([['rId1','notesMaster','../notesMasters/notesMaster1.xml'],['rId2','slide',`../slides/slide${i+1}.xml`]]));
    }
  });
  const z=makeZip(files);
  return new Blob([z],{type:'application/vnd.openxmlformats-officedocument.presentationml.presentation'});
}
/* 選 PPTX 時倍率不適用、批次鈕改成輸出整份簡報 */
function fmtUI(){$('scale').disabled=S.fmt==='pptx'||S.fmt==='svg';$('zipAll').querySelector('.tx').textContent=S.fmt==='pptx'?'目前分類的所有版型（PPTX 多頁）':'目前分類的所有版型（ZIP）'}
$('fmt').addEventListener('change',fmtUI);

