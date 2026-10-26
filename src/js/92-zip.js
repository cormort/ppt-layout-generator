/* ---------- 極簡 ZIP（store，不壓縮；PNG 本身已壓縮） ---------- */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRCT[(c^u8[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function makeZip(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  const u16=v=>{const a=new Uint8Array(2);new DataView(a.buffer).setUint16(0,v,true);return a};
  const u32=v=>{const a=new Uint8Array(4);new DataView(a.buffer).setUint32(0,v>>>0,true);return a};
  for(const f of files){
    const name=enc.encode(f.name),size=f.data.length,crc=crc32(f.data);
    parts.push(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(size),u32(size),u16(name.length),u16(0),name,f.data);
    cd.push([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(crc),u32(size),u32(size),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off),name]);
    off+=30+name.length+size;
  }
  let cdSize=0;const cdParts=[];
  for(const e of cd){for(const p of e)cdParts.push(p);let s=0;for(const p of e)s+=p.length;cdSize+=s}
  return new Blob([...parts,...cdParts,u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdSize),u32(off),u16(0)],{type:'application/zip'});
}
$('zipAll').onclick=async()=>{
  const list=tplList();
  if(!list.length){toast('這個分類沒有範本');return}
  const btn=$('zipAll');btn.disabled=true;
  try{
    if(S.fmt==='pptx'){
      saveBlob(await buildPptx(list,await currentImages(),(i,t)=>toast(`製作投影片… ${i+1}/${list.length}（${t.name}）`)),`${baseName()}_${S.cat==='all'?'全部':S.cat}_${list.length}頁.pptx`);
      toast(`已輸出 ${list.length} 頁 PPTX`);return;
    }
    const imgs=await currentImages(),files=[];
    for(let i=0;i<list.length;i++){
      const t=list[i];
      toast(`打包中… ${i+1}/${list.length}（${t.name}）`);
      const b=await exportBlob(t,S.fmt==='svg'?'svg':'png',Math.min(S.scale,2),imgs);
      files.push({name:`${String(i+1).padStart(2,'0')}_${t.id}.${S.fmt==='svg'?'svg':'png'}`,data:new Uint8Array(await b.arrayBuffer())});
      await new Promise(r=>setTimeout(r,0));
    }
    saveBlob(makeZip(files),`${baseName()}_${S.cat==='all'?'全部':S.cat}_${files.length}張.zip`);
    toast(`已打包 ${files.length} 張`);
  }catch(e){console.error(e);toast('打包失敗：'+e.message)}
  finally{btn.disabled=false}
};

