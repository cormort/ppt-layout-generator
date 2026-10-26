/* ---------- 項目編輯器：每行一列、「|」分欄；也可切回文字模式直接貼上 ---------- */
let itemsRaw=false;
const COLN=['重點','說明','補充','第 4 欄','第 5 欄'];
const itemRows=()=>String(S.items||'').split('\n').map(l=>l.split(/[|｜]/));
function itemsCount(){const n=String(S.items||'').split('\n').filter(s=>s.trim()).length;$('itemsN').textContent=n?String(n):''}
function setItems(rows){
  /* 只收掉真正空的結尾欄；只打了空白的欄位要留著，否則下一個字會被吃掉 */
  S.items=rows.map(r=>{const c=r.map(v=>String(v).replace(/[|｜\n]/g,' '));while(c.length>1&&c[c.length-1]==='')c.pop();return c.join('|')}).join('\n');
  $('items').value=S.items;itemsCount();save();refresh();
}
function renderItemsEd(){
  $('itemsEd').hidden=itemsRaw;$('items').hidden=!itemsRaw;$('itemAdd').hidden=itemsRaw;
  $('itemsMode').textContent=itemsRaw?'清單模式':'文字模式';$('itemsMode').setAttribute('aria-pressed',String(itemsRaw));
  itemsCount();if(itemsRaw)return;
  /* 項目空白時畫布顯示「項目一／二／三」示意，編輯器也給三列同樣的提示，兩邊對得上 */
  const blank=!String(S.items||'').trim(),rows=blank?[[''],[''],['']]:itemRows(),nc=Math.min(5,Math.max(2,...rows.map(r=>r.length)));
  $('itemsEd').innerHTML=rows.map((r,i)=>`<div class="r" data-i="${i}"><span class="no">${i+1}</span>`+
    '<div class="fs">'+[...Array(nc)].map((_,j)=>`<input type="text" class="${j?'cn':'c0'}" data-j="${j}" value="${esc(r[j]||'')}" placeholder="${blank&&!j?'項目'+'一二三'[i]:COLN[j]}" aria-label="第 ${i+1} 項・${COLN[j]}">`).join('')+'</div>'+
    `<div class="bt"><button type="button" data-a="u" aria-label="第 ${i+1} 項上移">↑</button><button type="button" data-a="d" aria-label="第 ${i+1} 項下移">↓</button><button type="button" data-a="x" aria-label="刪除第 ${i+1} 項">✕</button></div></div>`).join('');
}
$('itemsEd').addEventListener('input',e=>{const inp=e.target.closest('input');if(!inp)return;
  const rows=itemRows(),i=+inp.closest('.r').dataset.i,j=+inp.dataset.j;while(rows.length<=i)rows.push(['']);while(rows[i].length<=j)rows[i].push('');rows[i][j]=inp.value;setItems(rows)});
$('itemsEd').onclick=e=>{const b=e.target.closest('button');if(!b)return;const rows=itemRows(),i=+b.closest('.r').dataset.i;while(rows.length<=i)rows.push(['']);
  if(b.dataset.a==='x'){rows.splice(i,1);if(!rows.length)rows.push([''])}else{const j=b.dataset.a==='u'?i-1:i+1;if(j<0||j>=rows.length)return;[rows[i],rows[j]]=[rows[j],rows[i]]}
  setItems(rows);renderItemsEd()};
$('itemAdd').onclick=()=>{const rows=itemRows();rows.push(['']);setItems(rows);renderItemsEd();const ins=$('itemsEd').querySelectorAll('.r:last-child input');if(ins[0])ins[0].focus()};
$('itemsMode').onclick=()=>{itemsRaw=!itemsRaw;renderItemsEd()};
$('items').addEventListener('input',itemsCount);
/* 從 Excel／試算表貼上：Tab 分欄、換行分列 → 每列一項、「|」分欄；數字表格自動換成圖表版型 */
function tableFromClip(txt){
  const lines=String(txt||'').replace(/\r/g,'').split('\n');while(lines.length&&!lines[lines.length-1].trim())lines.pop();
  if(!lines.some(l=>l.includes('\t')))return null;
  return lines.map(l=>l.split('\t').map(v=>v.trim().replace(/^"(.*)"$/,'$1').replace(/[|｜]/g,'／')).join('|')).join('\n');
}
function pasteTable(e){
  const t=tableFromClip(e.clipboardData&&e.clipboardData.getData('text/plain'));if(!t)return false;e.preventDefault();
  S.items=t;$('items').value=t;let msg=`已貼上 ${t.split('\n').length} 列`;
  if(isNumericTable(t)&&TPLBY[S.tpl].cat!=='chart'){S.tpl=tplFor(chartKind(t));msg+=`，套用「${TPLBY[S.tpl].name}」；可到「版型」換成其他圖表`}
  storePage();save();renderItemsEd();drawAll();histLater();toast(msg);return true;
}
$('itemsEd').addEventListener('paste',pasteTable);$('items').addEventListener('paste',pasteTable);
/* 版面尺寸（整份）：切換時，不支援的版型換成這個尺寸能用的相近版型 */
const RATIO_NAMES=[['16:9','16:9 簡報'],['1:1','1:1'],['4:5','4:5'],['3:4','3:4'],['9:16','9:16']];
$('ratioSeg').innerHTML=RATIO_NAMES.map(([v,n])=>`<button type="button" data-v="${v}">${n}</button>`).join('');
function applyRatioUI(){[...$('ratioSeg').children].forEach(b=>{const on=b.dataset.v===S.ratio;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
$('ratioSeg').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.v===S.ratio)return;
  storePage();S.ratio=b.dataset.v;let n=0;for(const p of S.pages){const t=tplFor(p.tpl);if(t!==p.tpl){p.tpl=t;n++}}
  usePage(S.cur);pgCache.clear();pageChanged(`版面改成 ${S.ratio}`+(n?`，${n} 頁換成這個尺寸能用的版型（可按復原）`:''))};
/* 逐字稿字數與唸稿時間（約每分鐘 250 字） */
function notesCount(){const n=String(S.notes||'').replace(/\s/g,'').length,sec=Math.max(1,Math.round(n/250*60));$('notesCount').textContent=n?`${n} 字・約 ${sec>=60?Math.floor(sec/60)+' 分 ':''}${sec%60} 秒`:''}
$('notes').addEventListener('input',notesCount);
$('tplChange').onclick=()=>setTab('tpl');
$('prevPg').onclick=()=>goPage(S.cur-1);$('nextPg').onclick=()=>goPage(S.cur+1);

