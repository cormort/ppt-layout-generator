/* ---------- image pipeline ---------- */
function makeSamples(){
  const hues=[[200,35],[140,90],[30,200],[330,280],[260,180],[90,40]];
  return hues.map(([h1,h2],k)=>{const cv=document.createElement('canvas');cv.width=1200;cv.height=800;const x=cv.getContext('2d');
    const g=x.createLinearGradient(0,0,0,800);g.addColorStop(0,`hsl(${h1},70%,78%)`);g.addColorStop(1,`hsl(${h2},60%,88%)`);x.fillStyle=g;x.fillRect(0,0,1200,800);
    x.fillStyle=`hsla(${h2},90%,92%,.9)`;x.beginPath();x.arc(820,260,90,0,7);x.fill();const r=rng(k+3);
    for(let l=0;l<4;l++){x.fillStyle=`hsl(${(h1+l*25)%360},${45+l*8}%,${62-l*12}%)`;x.beginPath();x.moveTo(0,800);const base=380+l*110,a=r()*6;
      for(let i=0;i<=1200;i+=20)x.lineTo(i,base-Math.sin(i/180+a)*60-Math.sin(i/63+a*2)*18);x.lineTo(1200,800);x.fill()}
    const d=cv.toDataURL('image/jpeg',.85);return{src:d,thumb:d,full:d,data:d,w:1200,h:800}});
}
function hasAlpha(ctx,w,h){
  try{const d=ctx.getImageData(0,0,w,h).data,total=w*h,step=Math.max(1,Math.floor(total/4000));
    for(let i=0;i<total;i+=step)if(d[i*4+3]<250)return true}catch(e){}
  return false;
}
/* 縮圖並編碼：有透明就存 PNG，否則存 JPEG（原程式一律轉 JPEG，會讓透明背景變黑） */
function encode(bmp,w,h,q,alpha){
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const x=cv.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  x.drawImage(bmp,0,0,w,h);
  const detect=alpha===undefined?hasAlpha(x,w,h):alpha;
  return new Promise(r=>cv.toBlob(b=>r({blob:b,alpha:detect}),detect?'image/png':'image/jpeg',detect?undefined:q));
}
async function makeItem(name,bmp,crop=null,opts={}){
  const f=Math.min(1,2400/Math.max(bmp.width,bmp.height)),t=Math.min(1,520/Math.max(bmp.width,bmp.height));
  const force=!!opts.cutout;
  const thumb=await encode(bmp,Math.max(1,Math.round(bmp.width*t)),Math.max(1,Math.round(bmp.height*t)),.85,force||undefined);
  const full=await encode(bmp,Math.max(1,Math.round(bmp.width*f)),Math.max(1,Math.round(bmp.height*f)),.92,force||thumb.alpha);
  const it={id:++nid,name,full:URL.createObjectURL(full.blob),thumb:URL.createObjectURL(thumb.blob),blob:full.blob,tblob:thumb.blob,w:bmp.width,h:bmp.height,crop:cleanCrop(crop),cutout:force};
  lib.push(it);libSave(it);return it;
}
