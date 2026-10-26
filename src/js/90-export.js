/* ---------- 輸出 ---------- */
const safeName=s=>String(s||'').replace(/[\\/:*?"<>|\r\n\t]/g,'').trim().slice(0,60)||'排版';
const baseName=()=>safeName(S.fname||S.title||'排版');
function saveBlob(blob,name){
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
}
async function rasterize(tpl,imgs,scale,type){return rasterizeSVG(renderSVG(tpl,imgs,'e_'),scale,type)}
async function rasterizeSVG(svg,scale,type){
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const im=new Image();
    await new Promise((res,rej)=>{im.onload=res;im.onerror=()=>rej(new Error('向量圖轉點陣失敗'));im.src=url});
    /* 手機（尤其 iOS）的畫布有像素上限，太大時自動降一級倍率重試 */
    if(isIOS)scale=Math.min(scale,2);
    for(let s=scale;s>=1;s--){
      const cv=document.createElement('canvas');cv.width=W*s;cv.height=H*s;
      const ctx=cv.getContext('2d');if(!ctx)continue;
      if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height)}
      ctx.imageSmoothingQuality='high';ctx.drawImage(im,0,0,cv.width,cv.height);
      const blob=await new Promise(r=>{try{cv.toBlob(r,type,type==='image/jpeg'?.93:undefined)}catch(e){r(null)}});
      cv.width=cv.height=0;
      if(blob){if(s<scale)toast(`此裝置畫布有上限，已改用 ${s}× 輸出`);return blob}
    }
    throw new Error('瀏覽器無法輸出這個格式');
  }finally{URL.revokeObjectURL(url)}
}
async function exportBlob(tpl,fmt,scale,imgs){
  const I=imgs||await currentImages();
  if(fmt==='svg')return new Blob([renderSVG(tpl,I,'e_')],{type:'image/svg+xml;charset=utf-8'});
  return rasterize(tpl,I,scale,fmt==='jpeg'?'image/jpeg':'image/png');
}
const extOf=fmt=>fmt==='jpeg'?'jpg':fmt;
async function download(){
  try{
    const tpl=TPLBY[S.tpl]||TPL[0];
    if(S.fmt==='pptx'){
      toast('產生 PPTX 中…');
      saveBlob(await buildPptx([{tpl,imgs:await currentImages(),ov:null,notes:S.notes}]),`${baseName()}_${tpl.id}.pptx`);
      toast('已下載 PPTX（文字可在 PowerPoint 直接修改）');return;
    }
    toast('產生圖片中…');
    const b=await exportBlob(tpl,S.fmt,S.scale);
    saveBlob(b,`${baseName()}_${tpl.id}${S.fmt!=='svg'&&S.scale>1?'_'+S.scale+'x':''}.${extOf(S.fmt)}`);
    toast(`已下載（${S.fmt==='svg'?'向量 SVG':(W*S.scale)+'×'+(H*S.scale)}）`);
  }catch(e){console.error(e);toast('下載失敗：'+e.message)}
}
$('dl').onclick=download;
$('copy').onclick=async()=>{
  try{
    const b=await rasterize(TPLBY[S.tpl]||TPL[0],await currentImages(),2,'image/png');
    await navigator.clipboard.write([new ClipboardItem({'image/png':b})]);
    toast('已複製 2× 圖片，可直接到 PPT 貼上');
  }catch(e){toast('此瀏覽器不支援複製圖片，請改用下載')}
};

