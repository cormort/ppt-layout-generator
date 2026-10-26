/* ---------- 上方選單：檔案、匯出 ---------- */
const MENUS=[];
function menu(btn,box){
  const close=()=>{box.hidden=true;btn.setAttribute('aria-expanded','false')};
  btn.onclick=e=>{e.stopPropagation();const open=box.hidden;closeMenus();if(open){box.hidden=false;btn.setAttribute('aria-expanded','true');const f=box.querySelector('button:not([hidden]),select,input');if(f)f.focus()}};
  box.addEventListener('click',e=>{if(e.target.closest('.mi,#dl'))close()});
  MENUS.push(close);
}
function closeMenus(){MENUS.forEach(f=>f())}
menu($('fileBtn'),$('fileMenu'));menu($('expBtn'),$('expMenu'));
document.addEventListener('click',e=>{if(!e.target.closest('.menuwrap'))closeMenus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
$('mdDlgBtn').onclick=()=>$('mdDlg').showModal();
$('mdClose').onclick=()=>$('mdDlg').close();

/* 講義：每頁投影片＋逐字稿，開新視窗後直接叫出列印（可存成 PDF） */
$('handout').onclick=async()=>{
  const w=window.open('','_blank');if(!w){toast('瀏覽器擋住了新視窗，請允許本頁開彈出視窗');return}
  w.document.write('<p style="font:16px sans-serif;padding:24px">準備講義中…</p>');
  try{
    storePage();const d=await deckSlides(),svgOf=s=>s.svg.replace(/@@IMG(\d+)@@/g,(m,k)=>d.imgs[+k]);
    const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><title>${esc(deckName())}・講義</title><style>@page{size:A4;margin:14mm}body{margin:0;font:12pt/1.7 ${PLAYER_FONT};color:#222}.pg{break-inside:avoid;page-break-inside:avoid;margin:0 0 10mm}.pg svg{width:100%;height:auto;border:1px solid #ccc;display:block}.no{font-size:10pt;color:#666;margin:2mm 0}.nt{white-space:pre-wrap}@media screen{body{max-width:820px;margin:20px auto;padding:0 16px}}</style></head><body>`+
      d.slides.map((s,i)=>`<div class="pg">${svgOf(s)}<div class="no">${i+1} / ${d.slides.length}</div>${s.notes?`<div class="nt">${esc(s.notes)}</div>`:''}</div>`).join('')+
      `<script>addEventListener('load',()=>setTimeout(()=>print(),400))<\/script></body></html>`;
    w.document.open();w.document.write(html);w.document.close();
  }catch(e){console.error(e);w.close();toast('講義產生失敗：'+e.message)}
};

