/* 編輯器行為：新增／複製／刪除頁、復原、Markdown 匯入、逐字稿字數、去背與混色資料往返。 */
import { test, ok, eq, noErrors, deepEq } from './lib/check.mjs';

test('新增、複製、刪除頁面，刪掉的頁可以用復原救回來', async ({ page }) => {
  const got = await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    S.pages=[{...cleanPage({tpl:'tList',title:'A'}),sel:[]},{...cleanPage({tpl:'tList',title:'B'}),sel:[]}];
    S.cur=0;usePage(0);drawAll();await wait(200);
    histCommit();                                  /* 基準快照 */
    const out={start:S.pages.length,titles0:S.pages.map(p=>p.title)};
    addPage();await wait(300);histCommit();out.afterAdd=S.pages.length;
    S.cur=1;usePage(1);await wait(300);histCommit();
    addPage(true);await wait(300);histCommit();out.afterDup=S.pages.length;
    delPage(1);await wait(400);histCommit();out.afterDel=S.pages.length;
    histGo(-1);await wait(500);
    out.afterUndo=S.pages.length;
    out.titlesAfterUndo=S.pages.map(p=>p.title);
    return out;
  })()`);
  eq(got.start, 2, '起始頁數');
  eq(got.afterAdd, 3, '新增一頁');
  eq(got.afterDup, 4, '複製一頁');
  eq(got.afterDel, 3, '刪除一頁');
  /* 重點是「刪掉的頁回得來」，不是剛好回到幾頁（復原是一連串快照，中間步數不是契約） */
  eq(got.afterUndo, 4, '復原後頁數');
  ok(got.titlesAfterUndo.includes('B'), '復原後被刪掉的頁（B）沒有回來：' + JSON.stringify(got.titlesAfterUndo));
  noErrors(page.errors());
});

test('Markdown 匯入會產生對應頁數與版型', async ({ page }) => {
  const md = [
    '# 年度報告\n## 2026 成果',
    '',
    '---',
    '',
    '<!-- 版型: 對比 -->',
    '# 之前與之後',
    '- 之前|荒蕪',
    '- 之後|新生',
    '',
    '---',
    '',
    '| 季別 | 營收 |',
    '| Q1 | 120 |',
    '| Q2 | 180 |',
    '',
    '> 這一頁的講稿'
  ].join('\n');
  const got = await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const parsed=parseOutline(${JSON.stringify(md)});
    window.confirm=()=>true;
    S.pages=[{...cleanPage({tpl:'tList',title:'原本'}),sel:[]}];
    S.cur=0;usePage(0);
    importOutline(${JSON.stringify(md)},'replace');
    await wait(300);
    return {parsed:parsed.length,n:S.pages.length,tpls:S.pages.map(p=>p.tpl),
            notes:S.pages.map(p=>p.notes||''),items:S.pages.map(p=>p.items||'')};
  })()`);
  eq(got.parsed, 3, 'parseOutline 頁數');
  eq(got.n, 3, '匯入頁數');
  eq(got.tpls[1], 'cmp', '「版型: 對比」要對到 cmp');
  ok(/營收|Q1/.test(got.items[2]), '表格頁要保留表格內容');
  ok(/講稿/.test(got.notes[2]), '逐字稿要寫進最後一頁');
});

test('逐字稿字數與秒數估算', async ({ page }) => {
  const got = await page.run(`(()=>{
    S.notes='一二三四五'.repeat(16);
    notesCount();
    return document.getElementById('notesCount').textContent;
  })()`);
  ok(/80 字/.test(got), '字數統計不對：' + got);
  ok(/約 \d+ 秒/.test(got), '秒數估算不對：' + got);
});

test('去背會產生透明 PNG，並換進所有用到這張圖的頁面', async ({ page }) => {
  const got = await page.run(`(async()=>{
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const cv=document.createElement('canvas');cv.width=400;cv.height=500;
    const x=cv.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,400,500);
    x.fillStyle='#c0392b';x.beginPath();x.arc(200,250,120,0,7);x.fill();
    const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
    await addFiles([new File([blob],'sub.png',{type:'image/png'})]);
    await wait(300);
    const orig=lib[lib.length-1];
    S.pages=[{...cleanPage({tpl:'kPhoto',title:'T'}),sel:[orig.id]}];
    S.cur=0;usePage(0);
    const r=await cutoutBitmap(orig.blob,32);
    const nu=await makeItem(orig.name+'（去背）',r.bmp,null,{cutout:true});
    if(r.bmp.close)r.bmp.close();
    /* 檢查 alpha */
    const c2=document.createElement('canvas');c2.width=nu.w;c2.height=nu.h;
    const g2=c2.getContext('2d');const im=new Image();
    await new Promise(res=>{im.onload=res;im.src=nu.full});
    g2.drawImage(im,0,0);
    const d=g2.getImageData(0,0,nu.w,nu.h).data;
    const at=(px,py)=>d[(py*nu.w+px)*4+3];
    return {type:nu.blob.type,cutout:!!nu.cutout,corner:at(2,2),center:at(Math.round(nu.w/2),Math.round(nu.h/2)),
            origKept:lib.some(i=>i.id===orig.id)};
  })()`);
  eq(got.type, 'image/png', '去背輸出要是 PNG');
  eq(got.cutout, true, '要去背標記');
  eq(got.corner, 0, '角落 alpha 要是 0（透明）');
  eq(got.center, 255, '主體 alpha 要是 255');
  eq(got.origKept, true, '原圖要保留');
});

test('混色與不透明度會寫進畫面，並在轉點陣後保留', async ({ page }) => {
  const got = await page.run(`(async()=>{
    const cv=document.createElement('canvas');cv.width=4;cv.height=4;
    const g=cv.getContext('2d');g.fillStyle='#ccddee';g.fillRect(0,0,4,4);
    const url=cv.toDataURL('image/png');
    W=800;H=400;
    const mk=(attr)=>'<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">'
      +'<rect width="800" height="400" fill="#ffcc00"/>'
      +'<g '+attr+'><image href="'+url+'" x="0" y="0" width="800" height="400"/></g></svg>';
    const sample=async(svg)=>{
      const blob=await rasterizeSVG(svg,1,'image/png');
      const bmp=await createImageBitmap(blob);
      const c=document.createElement('canvas');c.width=bmp.width;c.height=bmp.height;
      const x2=c.getContext('2d',{willReadFrequently:true});x2.drawImage(bmp,0,0);
      const d=x2.getImageData(200,200,1,1).data;return [d[0],d[1],d[2]];
    };
    return {none:await sample(mk('')),mul:await sample(mk('style="mix-blend-mode:multiply"'))};
  })()`);
  deepEq(got.none, [204, 221, 238], '原圖');
  /* multiply(204,221,238 × 255,204,0) = (204, 177, 0) */
  ok(Math.abs(got.mul[0] - 204) <= 2 && Math.abs(got.mul[1] - 177) <= 2 && got.mul[2] <= 2,
    '色彩增值結果不對：' + got.mul.join(','));
});
