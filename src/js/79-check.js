/* ---------- 簡報健檢：一次掃過所有頁面，把「文字放不下、缺照片、沒標題、標題重複」列出來 ----------
   單頁看縮圖很難發現問題（十幾頁之後更是如此），所以做成一份可以點進去改的清單。
   逐字稿缺漏只算總數，不逐頁列 —— 三十頁沒逐字稿會變成一張三十列的清單，反而沒人看。 */
function deckCheck(){
  const issues=[],seen=new Map();
  let noNotes=0,photoPages=0,placeholder=0;
  S.pages.forEach((p,i)=>{
    const tpl=TPLBY[tplFor(p.tpl)]||TPLBY[p.tpl];
    if(!tpl)return;
    /* 文字放不下：用這一頁自己的內容渲染一次，跟「建議版型」用同一套判斷 */
    /* overflowNote 讀的是全域 S（標題、項目…），所以要在 withState 裡面一起算，
       否則拿到的是「目前這一頁」的內容，判斷會整個錯 */
    let note='';
    try{
      note=withState({...ovOf(p),pageNo:i},()=>{
        const svg=renderSVG(tpl,imgsOf(p.sel,'thumb'),'ck'+i+'_');
        return overflowNote(svg)||'';
      });
    }catch(e){note=''}
    if(note)issues.push({i,kind:'overflow',
      text:note.replace(/^⚠\s*/,'').replace(/。可以換範本，或把文字縮短。$/,''),
      hint:'縮短文字、拆成兩頁，或到「版型」換一個放得下的'});
    const needPhoto=usesPhoto(tpl);
    if(needPhoto)photoPages++;
    if(needPhoto&&!p.sel.length){placeholder++;issues.push({i,kind:'photo',text:'這個版型需要照片，目前用示意圖',hint:'到「照片」分頁選照片'})}
    const title=String(p.title||'').trim();
    if(!title)issues.push({i,kind:'title',text:'沒有標題',hint:'在「內容」分頁補上標題'});
    else if(seen.has(title))issues.push({i,kind:'dupe',text:'標題與第 '+(seen.get(title)+1)+' 頁重複：'+title,hint:'同一份簡報出現兩頁同名，很容易被誤認為重複頁'});
    else seen.set(title,i);
    if(!String(p.notes||'').trim())noNotes++;
  });
  issues.sort((a,b)=>a.i-b.i||a.kind.localeCompare(b.kind));
  return {issues,stats:{pages:S.pages.length,noNotes,photoPages,placeholder}};
}
const CHK_NAME={overflow:'文字放不下',photo:'缺照片',title:'沒有標題',dupe:'標題重複'};
function openCheck(){
  const r=deckCheck(),st=r.stats;
  $('chkSum').textContent=`${st.pages} 頁`
    +(r.issues.length?` · 找到 ${r.issues.length} 個問題`:' · 沒發現問題')
    +(st.noNotes?` · ${st.noNotes} 頁沒有逐字稿`:'');
  $('chkList').innerHTML=r.issues.length
    ?r.issues.map(o=>`<li><button data-go="${o.i}"><b>第 ${o.i+1} 頁</b><span class="k k-${o.kind}">${CHK_NAME[o.kind]||o.kind}</span><span class="t">${esc(o.text)}</span><span class="h">${esc(o.hint)}</span></button></li>`).join('')
    :`<li class="ok">沒有發現問題：${st.pages} 頁${st.noNotes?`（其中 ${st.noNotes} 頁沒有逐字稿，要不要補由你決定）`:'。'}</li>`;
  $('chkDlg').showModal();
}
$('chkList').onclick=e=>{
  const b=e.target.closest('[data-go]');if(!b)return;
  const i=+b.dataset.go;
  $('chkDlg').close();
  if(S.pages[i]){usePage(i);pageChanged(`跳到第 ${i+1} 頁`)}
};
$('chkClose').onclick=()=>$('chkDlg').close();
$('chkRun').onclick=openCheck;
