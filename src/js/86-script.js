/* ---------- 逐字稿匯出：整份簡報的講稿（含頁碼、版型、字數與預估時間），可列印或丟給別人 ---------- */
const notesChars=s=>String(s||'').replace(/\s/g,'').length;
const notesSec=n=>Math.max(1,Math.round(n/250*60));
const durText=s=>s>=60?`${Math.floor(s/60)} 分 ${String(s%60).padStart(2,'0')} 秒`:`${s} 秒`;
function scriptOf(fmt){
  storePage();
  const total=S.pages.reduce((a,p)=>a+notesChars(p.notes),0);
  const head=fmt==='txt'
    ? `${deckName()}\n${S.pages.length} 頁 · 逐字稿 ${total} 字 · 預估 ${durText(notesSec(total))}\n${'='.repeat(46)}\n`
    : `# ${deckName()}　逐字稿\n\n> ${S.pages.length} 頁 · 共 ${total} 字 · 預估 ${durText(notesSec(total))}\n`;
  const body=S.pages.map((p,i)=>{
    const t=String(p.notes||'').trim(),n=notesChars(t);
    const name=TPLBY[tplFor(p.tpl)]?.name||'';
    if(fmt==='txt'){
      return `\n── 第 ${i+1} 頁｜${p.title||'（無標題）'}｜${name}｜${n} 字 · ${durText(notesSec(n))}\n\n${t||'（這一頁沒有逐字稿）'}\n`;
    }
    return `\n## 第 ${i+1} 頁　${p.title||'（無標題）'}\n\n*${name} · ${n} 字 · ${durText(notesSec(n))}*\n\n${(t||'（這一頁沒有逐字稿）').split('\n').join('\n\n')}\n`;
  }).join('');
  return head+body;
}
const saveScript=fmt=>{
  saveBlob(new Blob([scriptOf(fmt)],{type:fmt==='txt'?'text/plain;charset=utf-8':'text/markdown;charset=utf-8'}),`${deckName()}_逐字稿.${fmt==='txt'?'txt':'md'}`);
  const empty=S.pages.filter(p=>!String(p.notes||'').trim()).length;
  toast(`已匯出逐字稿 ${S.pages.length} 頁`+(empty?`（其中 ${empty} 頁空白）`:''));
};
$('notesMd').onclick=()=>saveScript('md');
$('notesTxt').onclick=()=>saveScript('txt');
