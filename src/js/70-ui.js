/* ---------- UI ---------- */
/* 只有滑鼠才用拖曳排序；觸控螢幕上拖曳屬性會吃掉捲動手勢，改用 ◀ ▶ 按鈕 */
const FINE=matchMedia('(pointer:fine)');
function drawLib(){
  $('lib').innerHTML=lib.map(it=>{const n=sel.indexOf(it.id);return`<div class="it ${n>=0?'on':''}${it.cutout?' cut':''}" data-id="${it.id}" data-n="${n+1}" title="${esc(it.name)}" role="button" tabindex="0" aria-pressed="${n>=0}" aria-label="${esc(it.name)}"><img src="${it.thumb}" alt="" draggable="false"></div>`}).join('');
  $('libInfo').textContent=lib.length?`共 ${lib.length} 張，這一頁用了 ${sel.length} 張`:'';
  $('order').innerHTML=sel.length?sel.map((id,i)=>{const it=lib.find(x=>x.id===id);return`<div class="o${it.crop?' cut':''}${id===cropId?' edit':''}" draggable="${FINE.matches}" data-i="${i}"><img src="${it.thumb}" alt="" draggable="false"><span class="b">${i+1}</span><div class="ctl"><button data-a="l" aria-label="往前移">◀</button><button data-a="c" aria-label="裁切" title="放大／裁切">✂</button><button data-a="x" aria-label="移除">✕</button><button data-a="r" aria-label="往後移">▶</button></div></div>`}).join(''):'<span class="empty">尚未選擇（預覽暫用示意圖）</span>';
  if(cropId&&!sel.includes(cropId))closeCrop();
  $('delUnsel').disabled=!lib.length;$('delAll').disabled=!lib.length;
}
function toggleSel(id){const i=sel.indexOf(id);i>=0?sel.splice(i,1):sel.push(id);drawLib();refresh()}
$('lib').onclick=e=>{const d=e.target.closest('.it');if(!d)return;toggleSel(+d.dataset.id)};
$('lib').onkeydown=e=>{if(e.key!=='Enter'&&e.key!==' ')return;const d=e.target.closest('.it');if(!d)return;e.preventDefault();toggleSel(+d.dataset.id)};
$('order').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.closest('.o').dataset.i,a=b.dataset.a;
  if(a==='c'){openCrop(sel[i]);return}
  if(a==='x')sel.splice(i,1);else{const j=a==='l'?i-1:i+1;if(j<0||j>=sel.length)return;[sel[i],sel[j]]=[sel[j],sel[i]]}drawLib();refresh()};

