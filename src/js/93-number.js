/* ---------- 連續編號：項目清單每行一頁，數字自動遞增、每頁換下一張圖 ---------- */
function withState(ov,fn){
  if(!ov)return fn();
  const keep={};for(const k in ov)keep[k]=S[k];
  Object.assign(S,ov);try{return fn()}finally{Object.assign(S,keep)}
}
/* 「01」→ 01,02…；「Part 3」→ Part 3, Part 4…；沒有數字就從 01 開始 */
function numberSeq(seed,n){
  const m=String(seed||'').match(/^(.*?)(\d+)(\D*)$/),pre=m?m[1]:'',start=m?+m[2]:1,w=m?m[2].length:2,suf=m?m[3]:'';
  return[...Array(n)].map((_,i)=>pre+String(start+i).padStart(w,'0')+suf);
}
function numberedPages(imgs){
  const rows=String(S.items||'').split('\n').map(s=>s.trim()).filter(Boolean).map(s=>{const[a,b='']=s.split(/[|｜]/);return{a:a.trim(),b:b.trim()}});
  const cur=TPLBY[S.tpl],nums=numberSeq(S.number,rows.length),tpl=cur&&cur.cat==='sec'?cur:TPL.find(t=>t.cat==='sec');
  return rows.map((r,i)=>({tpl,num:nums[i],
    imgs:imgs.length>1?imgs.map((_,k)=>imgs[(i+k)%imgs.length]):imgs,
    ov:{number:nums[i],title:r.a,subtitle:r.b||S.subtitle,pageNo:i}}));
}
$('numBatch').onclick=async()=>{
  const btn=$('numBatch'),imgs=await currentImages(),pages=numberedPages(imgs);
  if(!pages.length){toast('請先在「項目」每行輸入一個章節標題');setTab('content');return}
  btn.disabled=true;
  try{
    const tpl=pages[0].tpl,stem=`${baseName()}_${tpl.id}_編號${pages[0].num}-${pages[pages.length-1].num}`.replace(/[\\/:*?"<>|]/g,'');
    if(S.fmt==='pptx'){
      saveBlob(await buildPptx(pages,imgs,i=>toast(`製作投影片… ${i+1}/${pages.length}`)),`${stem}.pptx`);
      toast(`已輸出 ${pages.length} 頁 PPTX（${pages[0].num}–${pages[pages.length-1].num}）`);return;
    }
    const ext=S.fmt==='svg'?'svg':S.fmt==='jpeg'?'jpg':'png',files=[];
    for(let i=0;i<pages.length;i++){
      const p=pages[i];toast(`輸出中… ${i+1}/${pages.length}（${p.num}）`);
      const svg=withState(p.ov,()=>renderSVG(p.tpl,p.imgs,'n'+i+'_'));
      const b=ext==='svg'?new Blob([svg],{type:'image/svg+xml;charset=utf-8'}):await rasterizeSVG(svg,Math.min(S.scale,2),ext==='jpg'?'image/jpeg':'image/png');
      files.push({name:`${String(i+1).padStart(2,'0')}_${safeName(p.num)}.${ext}`,data:new Uint8Array(await b.arrayBuffer())});
      await new Promise(r=>setTimeout(r,0));
    }
    saveBlob(makeZip(files),`${stem}.zip`);
    toast(`已輸出 ${files.length} 張（${pages[0].num}–${pages[pages.length-1].num}）`);
  }catch(e){console.error(e);toast('輸出失敗：'+e.message)}
  finally{btn.disabled=false}
};

