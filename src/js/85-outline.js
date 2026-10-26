/* ---------- Markdown 大綱：匯入成頁面、把頁面匯出成大綱 ---------- */
const TPL_ALIAS={封面:'split',章節:'bignum',條列:'tList',方格:'tGrid',表格:'tTable',段落:'tText',內文:'tText',引言:'tQuote',金句:'tQuote',大標題:'ocean',
  圖表:'cBar',長條:'cBar',直條:'cBar',長條圖:'cBar',直條圖:'cBar',橫條:'cHbar',橫條圖:'cHbar',折線:'cLine',折線圖:'cLine',圓餅:'cPie',圓餅圖:'cPie',環圈:'cPie',環圈圖:'cPie',
  雜誌:'mCover',雜誌封面:'mCover',專題:'mFeature',文章:'mColumns',兩欄:'mColumns',目錄:'mIndex',
  圖卡:'kAnnounce',公告:'kAnnounce',照片公告:'kPhoto',重點卡:'kList',數據卡:'kNumber',金句卡:'kQuote',
  對比:'cmp',前後:'cmp',前後對比:'cmp',比較:'cmpVs',人物引言:'kPortrait',人像:'kPortrait',照片牆:'wall',拼貼:'wall',
  數據並列:'tStats',數字並列:'tStats',大字目錄:'tocNum',編號目錄:'tocNum',撕紙:'cnTear',宣紙:'cnQuote',中國風金句:'cnQuote',感謝:'thanks',結尾:'thanks',
  去背:'cutoutCard',去背主體:'cutoutCard',主體:'cutoutCard',雙色調:'duotone',雙色:'duotone'};
function tplFrom(v){
  v=String(v||'').trim();if(!v)return '';
  if(TPLBY[v])return v;if(TPL_ALIAS[v])return TPL_ALIAS[v];
  const t=TPL.find(t=>t.id.toLowerCase()===v.toLowerCase())||TPL.find(t=>t.name.includes(v));return t?t.id:'';
}
/* 沒指定版型時依內容挑：章節數字→大數字、數字表格→圖表、表格→表格、第一頁→封面、只有標題→大標題、有項目→條列、只有內文→段落 */
function autoTpl(p,i,table,{chart=true}={}){
  const n=p.items.split('\n').filter(s=>s.trim()).length;
  if(p.number&&n<=1)return 'bignum';
  if(table&&chart&&isNumericTable(p.items))return chartKind(p.items);
  if(table)return 'tTable';
  if(i===0&&!n)return 'split';
  if(!n&&!p.body)return 'ocean';
  if(n)return 'tList';
  return 'tText';
}
const mdPlain=s=>s.replace(/\*\*(.+?)\*\*|__(.+?)__/g,'$1$2').replace(/`([^`]+)`/g,'$1').trim();
function parseOutline(src){
  const pages=[];let p=null,body=[],items=[],notes=[],tpl='',nextTpl='',table=false;
  const cur=()=>p||(p={title:'',subtitle:'',body:'',items:'',number:'',notes:''});
  const flush=()=>{
    if(p){p.body=body.join('\n').replace(/^\n+|\n+$/g,'');p.items=items.join('\n');p.notes=notes.join('\n').replace(/^\n+|\n+$/g,'');
      if(p.title||p.subtitle||p.body||p.items||p.notes||p.number)pages.push(cleanPage({...p,tpl:tplFrom(tpl)||autoTpl(p,pages.length,table)}))}
    p=null;body=[];items=[];notes=[];tpl=nextTpl;nextTpl='';table=false;
  };
  /* 版型註解寫在「# 標題」前面時屬於下一頁；後面先出現其他內容就歸目前這一頁 */
  const content=()=>{if(nextTpl){tpl=nextTpl;nextTpl=''}return cur()};
  for(const raw of String(src).replace(/\r\n?/g,'\n').split('\n')){
    const line=raw.replace(/\s+$/,'');let m;
    if(/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)){flush();continue}
    if((m=line.match(/^\s*<!--\s*(?:版型|範本|template)\s*[:：]\s*(.+?)\s*-->\s*$/i))){if(p&&p.title)nextTpl=m[1];else tpl=m[1];continue}
    if(/^\s*<!--.*-->\s*$/.test(line))continue;
    if((m=line.match(/^#\s+(.*)/))){if(p&&p.title)flush();if(nextTpl){tpl=nextTpl;nextTpl=''}cur().title=mdPlain(m[1]);continue}
    if((m=line.match(/^##\s+(.*)/))){const q=content();if(q.subtitle)body.push(mdPlain(m[1]));else q.subtitle=mdPlain(m[1]);continue}
    if((m=line.match(/^#{3,6}\s+(.*)/))){content();body.push(mdPlain(m[1]));continue}
    if((m=line.match(/^\s*(?:數字|編號|number)\s*[:：]\s*(.*)/i))){content().number=mdPlain(m[1]);continue}
    if((m=line.match(/^\s*>\s?(.*)/))){content();notes.push(m[1].trim());continue}
    if((m=line.match(/^\s*\|(.*)\|\s*$/))){content();if(!/^[\s|:-]+$/.test(m[1])){items.push(m[1].split('|').map(mdPlain).join('|'));table=true}continue}
    if((m=line.match(/^\s*(?:[-*+]|\d+[.)、])\s+(.*)/))){content();items.push(mdPlain(m[1]));continue}
    if(!line.trim()){if(body.length&&body[body.length-1]!=='')body.push('');continue}
    content();body.push(mdPlain(line));
  }
  flush();
  return pages;
}
function outlineOf(pages){
  return pages.map((p,i)=>{
    const o=[`<!-- 第 ${i+1} 頁 -->`,`<!-- 版型: ${p.tpl} -->`];
    if(p.title)o.push('# '+p.title);if(p.subtitle)o.push('## '+p.subtitle);if(p.number)o.push('數字: '+p.number);
    if(p.body.trim())o.push('',...p.body.split('\n'));
    const it=p.items.split('\n').filter(s=>s.trim());
    if(it.length)o.push('',...(p.tpl==='tTable'?it.map(s=>'| '+s.split(/[|｜]/).join(' | ')+' |'):it.map(s=>'- '+s)));
    if(p.notes.trim())o.push('',...p.notes.split('\n').map(l=>l.trim()?'> '+l:'>'));
    return o.join('\n');
  }).join('\n\n---\n\n')+'\n';
}
function importOutline(src,mode){
  let ps=parseOutline(src);for(const p of ps)p.tpl=tplFor(p.tpl);
  if(!ps.length){toast('沒有讀到任何頁面：每頁用「# 標題」開頭，或用 --- 分頁');return}
  storePage();
  const room=MAXPAGES-(mode==='replace'?0:S.pages.length);
  if(ps.length>room){if(!confirm(`整份最多 ${MAXPAGES} 頁，大綱只會匯入前 ${Math.max(0,room)} 頁，要繼續嗎？`))return;ps=ps.slice(0,Math.max(0,room))}
  if(!ps.length){toast(`已達 ${MAXPAGES} 頁上限`);return}
  if(mode==='replace'){
    if(S.pages.length>1&&!confirm(`用大綱的 ${ps.length} 頁取代目前的 ${S.pages.length} 頁？（可按復原）`))return;
    S.pages=ps;usePage(0);
  }else{const at=S.pages.length;S.pages.push(...ps);usePage(at)}
  const nn=ps.filter(p=>p.notes.trim()).length;
  pageChanged(`已匯入 ${ps.length} 頁`+(nn?`（${nn} 頁有逐字稿）`:''));
  return true;
}
$('mdReplace').onclick=()=>{if(importOutline($('mdIn').value,'replace'))$('mdDlg').close()};
$('mdAppend').onclick=()=>{if(importOutline($('mdIn').value,'append'))$('mdDlg').close()};
$('mdOpen').onclick=()=>$('mdFile').click();
$('mdFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  try{$('mdIn').value=await f.text();toast(`已讀入 ${f.name}，按「取代全部頁面」或「加在後面」`)}catch(err){toast('讀取失敗：'+err.message)}};
$('mdExport').onclick=()=>{storePage();saveBlob(new Blob([outlineOf(S.pages)],{type:'text/markdown;charset=utf-8'}),`${deckName()}_大綱.md`);toast(`已匯出 ${S.pages.length} 頁大綱`)};

