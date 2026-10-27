/* ---------- 專案存檔 ---------- */
$('projSave').onclick=async()=>{
  try{
    toast('整理專案中…');storePage();
    /* v2：存所有頁面用到的圖，每頁的 sel 改存成 images 陣列的索引 */
    const L=[...new Set(S.pages.flatMap(p=>p.sel))].map(id=>lib.find(x=>x.id===id)).filter(Boolean),at=new Map(L.map((it,i)=>[it.id,i]));
    const imgs=await Promise.all(L.map(async it=>({name:it.name,crop:it.crop,data:it.data||(it.data=await blobToData(it.blob))})));
    const state={...S,pages:S.pages.map(p=>({...p,sel:p.sel.filter(id=>at.has(id)).map(id=>at.get(id))}))};
    const pkg={app:'ppt-layout-generator',v:2,state,images:imgs};
    saveBlob(new Blob([JSON.stringify(pkg)],{type:'application/json'}),`${deckName()}.pptgen.json`);
    toast(`已存檔（${S.pages.length} 頁、${imgs.length} 張圖片）`);
  }catch(e){toast('存檔失敗：'+e.message)}
};
$('projLoad').onclick=()=>$('projFile').click();
$('projFile').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{
    const pkg=JSON.parse(await f.text());
    if(!pkg||pkg.app!=='ppt-layout-generator'||!pkg.state)throw new Error('不是這個工具的專案檔');
    for(const it of lib)dropItem(it);
    lib.length=0;sel=[];closeCrop();
    const st=sanitise(pkg.state),ids=[];
    if(Array.isArray(pkg.images)){
      toast(`載入 ${pkg.images.length} 張圖片…`);
      for(const im of pkg.images){
        let id=0;
        try{const blob=await(await fetch(im.data)).blob();const bmp=await createImageBitmap(blob);const it=await makeItem(im.name||'image',bmp,im.crop);if(bmp.close)bmp.close();id=it.id}catch(err){console.warn(err)}
        ids.push(id);
      }
    }
    /* v1 只有單頁：全部圖片都給它；v2 把每頁的索引換回新的圖片編號 */
    if(st.pages.length&&pkg.v>=2)for(const p of st.pages)p.sel=p.sel.map(k=>ids[k]).filter(Boolean);
    else st.pages=[];
    Object.assign(S,st);
    if(S.pages.length)usePage(S.cur);else{sel=ids.filter(Boolean);storePage()}
    syncUI();drawLib();drawAll();save();histLater();toast(`專案已載入（${S.pages.length} 頁）`);
  }catch(err){console.warn(err);toast('載入失敗：'+err.message)}
};
$('reset').onclick=()=>{
  if(!confirm('重設所有頁面、文字與樣式？只會留下目前這一頁的圖片（可按復原）'))return;
  Object.assign(S,{...DEF,pages:[],cur:0,logo:S.logo,logoAR:S.logoAR,theme:S.theme,cat:S.cat,fmt:S.fmt,scale:S.scale,pptText:S.pptText,pptQ:S.pptQ});
  storePage();save();syncUI();drawAll();histLater();toast('已重設');
};
function syncUI(){
  for(const k of['title','subtitle','body','items','number','notes','company','date','page','fname'])$(k).value=S[k];
  $('tf').value=S.tf;$('bf').value=S.bf;$('color').value=S.color;$('accent').value=S.accent;$('bg').value=S.bg;
  $('logoPos').value=S.logoPos;$('bullet').value=S.bullet;$('logoSize').value=S.logoSize;$('fmt').value=S.fmt;$('pptText').value=S.pptText;$('pptQ').value=S.pptQ;$('scale').value=S.scale;$('fs').value=S.fs;showFs();fmtUI();
  for(const k of['footer','logoBg','bgOn','single','secSync'])$(k).checked=S[k];
  showLogo();showLogoSize();applyTheme();applyFocal();drawFilters();
  renderItemsEd();notesCount();applyRatioUI();
  if(S.body.trim()||S.number.trim())$('moreFields').open=true;
}

