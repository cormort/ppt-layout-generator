/* ---------- UI ---------- */
/* 只有滑鼠才用拖曳排序；觸控螢幕上拖曳屬性會吃掉捲動手勢，改用 ◀ ▶ 按鈕 */
const FINE=matchMedia('(pointer:fine)');
/* 圖庫整理：哪些照片整份簡報都沒用到、每張多大、可以改名 */
let libOnlyUnused=false;
const usedIds=()=>{const s=new Set();for(const p of S.pages)for(const id of p.sel)s.add(id);return s};
const fmtSize=b=>b>=1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB';
function drawLib(){
  const used=usedIds(),unusedN=lib.filter(it=>!used.has(it.id)).length;
  const shown=libOnlyUnused?lib.filter(it=>!used.has(it.id)):lib;
  $('lib').innerHTML=shown.map(it=>{const n=sel.indexOf(it.id),un=!used.has(it.id);
    const tip=`${it.name}${it.blob?'・'+fmtSize(it.blob.size):''}${un?'・未使用':''}（雙擊改名）`;
    return`<div class="it ${n>=0?'on':''}${it.cutout?' cut':''}${un?' unused':''}" data-id="${it.id}" data-n="${n+1}" title="${esc(tip)}" role="button" tabindex="0" aria-pressed="${n>=0}" aria-label="${esc(it.name)}"><img src="${it.thumb}" alt="" draggable="false">${un?'<span class="un">未用</span>':''}</div>`}).join('')
    ||`<span class="empty">${lib.length?'沒有未使用的照片':'還沒有照片，把圖片拖進來或按上面「選擇照片」'}</span>`;
  const bytes=lib.reduce((a,it)=>a+(it.blob?it.blob.size:0),0);
  $('libInfo').textContent=lib.length?`共 ${lib.length} 張（${fmtSize(bytes)}）${unusedN?`・${unusedN} 張未使用`:''}，這一頁用了 ${sel.length} 張`:'';
  $('order').innerHTML=sel.length?sel.map((id,i)=>{const it=lib.find(x=>x.id===id);return`<div class="o${it.crop?' cut':''}${id===cropId?' edit':''}" draggable="${FINE.matches}" data-i="${i}"><img src="${it.thumb}" alt="" draggable="false"><span class="b">${i+1}</span><div class="ctl"><button data-a="l" aria-label="往前移">◀</button><button data-a="c" aria-label="裁切" title="放大／裁切">✂</button><button data-a="x" aria-label="移除">✕</button><button data-a="r" aria-label="往後移">▶</button></div></div>`}).join(''):'<span class="empty">尚未選擇（預覽暫用示意圖）</span>';
  if(cropId&&!sel.includes(cropId))closeCrop();
  $('delUnsel').disabled=!unusedN;$('delAll').disabled=!lib.length;
  const fl=$('libUnused');if(fl){fl.checked=libOnlyUnused;fl.parentElement.querySelector('b').textContent=unusedN?`只看未使用（${unusedN}）`:'只看未使用'}
}
function toggleSel(id){const i=sel.indexOf(id);i>=0?sel.splice(i,1):sel.push(id);drawLib();refresh()}
$('lib').onclick=e=>{const d=e.target.closest('.it');if(!d)return;toggleSel(+d.dataset.id)};
$('lib').onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const d=e.target.closest('.it');if(!d)return;e.preventDefault();toggleSel(+d.dataset.id)};
$('order').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.closest('.o').dataset.i,a=b.dataset.a;
  if(a==='c'){openCrop(sel[i]);return}
  if(a==='x')sel.splice(i,1);else{const j=a==='l'?i-1:i+1;if(j<0||j>=sel.length)return;[sel[i],sel[j]]=[sel[j],sel[i]]}drawLib();refresh()};

