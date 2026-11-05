/* ---------- 簡報健檢：一次掃過所有頁面，把「文字放不下、缺照片、沒標題、標題重複」列出來 ----------
   單頁看縮圖很難發現問題（十幾頁之後更是如此），所以做成一份可以點進去改的清單。
   逐字稿缺漏只算總數，不逐頁列 —— 三十頁沒逐字稿會變成一張三十列的清單，反而沒人看。 */
function deckCheck(){
  const issues=[],seen=new Map(),missPhoto=[];
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
      hint:'縮短文字、拆成兩頁，或到「版型」換一個放得下的',fix:'tpl'});
    const needPhoto=usesPhoto(tpl);
    if(needPhoto)photoPages++;
    if(needPhoto&&!p.sel.length){placeholder++;missPhoto.push(i)}
    const title=String(p.title||'').trim();
    if(!title)issues.push({i,kind:'title',text:'沒有標題',hint:'在「內容」分頁補上標題',fix:'title'});
    else if(seen.has(title))issues.push({i,kind:'dupe',text:'標題與第 '+(seen.get(title)+1)+' 頁重複：'+title,
      hint:'同一份簡報出現兩頁同名，很容易被誤認為重複頁，一鍵修會加上「（續）」',fix:'dupe'});
    else seen.set(title,i);
    if(!String(p.notes||'').trim())noNotes++;
  });
  /* 缺照片常常是一口氣十幾頁（封面、章節頁都要照片），合成一列才不會把清單淹掉 */
  if(missPhoto.length){
    const list=missPhoto.slice(0,8).map(i=>i+1).join('、')+(missPhoto.length>8?'…':'');
    issues.push({i:missPhoto[0],kind:'photo',pages:missPhoto,
      text:`${missPhoto.length} 頁需要照片（第 ${list} 頁）`,
      hint:'到「照片」分頁選照片；也可以只補封面與章節這幾頁'});
  }
  issues.sort((a,b)=>a.i-b.i||a.kind.localeCompare(b.kind));
  return {issues,stats:{pages:S.pages.length,noNotes,photoPages,placeholder}};
}
const CHK_NAME={overflow:'文字放不下',photo:'缺照片',title:'沒有標題',dupe:'標題重複'};
/* 找一個這一頁放得下的版型：先同分類，再全部；最多試 40 個 */
function fitTplFor(p){
  const base=TPLBY[tplFor(p.tpl)];
  const pool=[...TPL.filter(t=>tplOK(t)&&base&&t.cat===base.cat),...TPL.filter(t=>tplOK(t))].slice(0,40);
  for(const t of pool){
    if(t.id===p.tpl)continue;
    try{
      const ok=withState({...ovOf(p),pageNo:S.cur,tpl:t.id},()=>!overflowNote(renderSVG(t,imgsOf(p.sel,'thumb'),'fx_'+t.id+'_')));
      if(ok)return t.id;
    }catch(e){}
  }
  return '';
}
/* 回傳「做了什麼」給 toast；不能自動修的回空字串 */
function fixIssue(o){
  const p=S.pages[o.i];if(!p)return '';
  if(o.kind==='dupe'){
    const t=String(p.title||'').trim();
    p.title=/（續）$/.test(t)?t+'二':t+'（續）';
    return `第 ${o.i+1} 頁改名為「${p.title}」`;
  }
  if(o.kind==='title'){
    const n=TPLBY[tplFor(p.tpl)]?.name||'未命名';
    p.title=n;return `第 ${o.i+1} 頁補上標題「${n}」`;
  }
  if(o.kind==='overflow'){
    const id=fitTplFor(p);if(!id)return '';
    p.tpl=id;if(S.cur===o.i)S.tpl=id;
    return `第 ${o.i+1} 頁換成「${TPLBY[id].name}」`;
  }
  return '';
}
let chkLast=[];
function openCheck(){
  const r=deckCheck(),st=r.stats;chkLast=r.issues;
  $('chkSum').textContent=`${st.pages} 頁`
    +(r.issues.length?` · 找到 ${r.issues.length} 個問題`:' · 沒發現問題')
    +(st.noNotes?` · ${st.noNotes} 頁沒有逐字稿`:'');
  const fixable=r.issues.filter(o=>o.fix).length;
  $('chkList').innerHTML=r.issues.length
    ?r.issues.map((o,k)=>`<li><div class="row2"><button class="go" data-go="${o.i}"><b>第 ${o.i+1} 頁</b><span class="k k-${o.kind}">${CHK_NAME[o.kind]||o.kind}</span><span class="t">${esc(o.text)}</span><span class="h">${esc(o.hint)}</span></button>`
      +(o.fix?`<button class="fx" data-fix="${k}" title="自動修這一項">修</button>`:'')+`</div></li>`).join('')
    :`<li class="ok">沒有發現問題：${st.pages} 頁${st.noNotes?`（其中 ${st.noNotes} 頁沒有逐字稿，要不要補由你決定）`:'。'}</li>`;
  $('chkFixAll').hidden=!fixable;
  $('chkFixAll').textContent=fixable?`一鍵修（${fixable}）`:'';
  if(!$('chkDlg').open)$('chkDlg').showModal();
}
/* 一項一項修：修完重畫清單，讓使用者看到還剩什麼 */
function fixOne(o){
  const what=fixIssue(o);
  if(!what){toast('這一項無法自動修，請手動處理');return false}
  pageChanged(what);openCheck();return true;
}
$('chkFixAll').onclick=()=>{
  let n=0;const msgs=[];
  for(const o of chkLast.slice())if(o.fix){const w=fixIssue(o);if(w){n++;msgs.push(w)}}
  if(!n){toast('沒有可以自動修的項目');return}
  pageChanged(`已自動修 ${n} 處`);openCheck();
};
$('chkList').onclick=e=>{
  const fx=e.target.closest('[data-fix]');
  if(fx){fixOne(chkLast[+fx.dataset.fix]);return}
  const b=e.target.closest('[data-go]');if(!b)return;
  const i=+b.dataset.go;
  $('chkDlg').close();
  if(S.pages[i]){usePage(i);pageChanged(`跳到第 ${i+1} 頁`)}
};
$('chkClose').onclick=()=>$('chkDlg').close();
$('chkRun').onclick=openCheck;
