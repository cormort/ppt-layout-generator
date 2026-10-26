/* ---------- 文字溢出偵測：輸出的圖裡看不到的字就提醒 ---------- */
function plainOf(svg){return unesc(String(svg).replace(/<[^>]*>/g,' ')).replace(/\s+/g,'').toLowerCase()}
/* 只在「開頭有出現、結尾沒出現」時判定被截斷，
   所以範本根本沒用到某個欄位時不會誤報 */
function overflowNote(svg){
  /* 頁尾（單位｜日期｜頁碼）不算版面內容：先拿掉，免得「2026 年度計畫」的開頭剛好撞到日期 2026.10 而誤報 */
  let flat=plainOf(svg);const miss=[];
  if(S.footer)for(const f of[S.company,S.date,pageLabel()]){const v=String(f||'').replace(/\s+/g,'').toLowerCase();if(v)flat=flat.split(v).join(' ')}
  /* 完整字串有出現 → 沒被截斷；只有開頭出現 → 被截斷；完全沒出現 → 這個範本沒用到這欄，不提醒 */
  const check=(label,val)=>{
    const v=String(val||'').replace(/\s+/g,'').toLowerCase();
    if(v.length<5||flat.includes(v))return;
    const head=v.slice(0,Math.min(8,Math.max(4,Math.floor(v.length/2))));
    if(flat.includes(head))miss.push(label);
  };
  check('標題',S.title);check('副標題',S.subtitle);check('內文',S.body);
  /* 第一欄空白的列（例如圖表的表頭）不列入檢查 */
  const lines=String(S.items||'').split('\n').map(s=>s.trim()).filter(l=>l.split(/[|｜]/)[0].replace(/\s+/g,'').length>=1);
  let shown=0;
  for(const l of lines){
    const head=l.split(/[|｜]/)[0].replace(/\s+/g,'').toLowerCase();
    if(flat.includes(head))shown++;
  }
  /* 有些版型本來就只吃前幾個項目（對比頁只取 2 個、數據亮點只取 1 個），用 maxItems 宣告，不要誤報 */
  const cap=(TPLBY[S.tpl]||{}).maxItems;
  const expect=cap?Math.min(lines.length,cap):lines.length;
  if(lines.length&&shown>0&&shown<expect)miss.push('項目清單');
  if(!miss.length)return '';
  return `⚠ ${miss.join('、')} 超出這個範本的容量，多出來的部分不會出現在圖上。可以換範本，或把文字縮短。`;
}

