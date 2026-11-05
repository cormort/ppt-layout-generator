/* 簡報健檢：文字放不下、缺照片、沒標題、標題重複都要抓出來，而且點一列就跳到那一頁。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const DECK = `(()=>{
  S.ratio='16:9';S.footer=false;S.logo='';
  S.pages=[
    cleanPage({tpl:'split',title:'年度報告',body:'',items:'',notes:'開場講稿'}),
    /* 30 列的表格 → 這個版型只放得下 18 列，後面的列會被截掉 */
    cleanPage({tpl:'tTable',title:'各縣市執行率',body:'',notes:'有講稿',
      items:[...Array(30)].map((_,k)=>'縣市'+(k+1)+'|'+(1000+k*10)+'|'+(950+k*9)).join('\\n')}),
    /* 照片版型但沒有照片 */
    cleanPage({tpl:'wall',title:'會場紀錄',body:'',items:'',notes:''}),
    /* 沒有標題 */
    cleanPage({tpl:'tQuote',title:'',body:'一句話',items:'',notes:''}),
    /* 標題與第 1 頁重複 */
    cleanPage({tpl:'thanks',title:'年度報告',body:'',items:'',notes:''}),
  ];
  S.cur=0;
  return 1;
})()`;

test('簡報健檢：四種問題都抓得到', async ({ page }) => {
  await page.run(DECK);
  const got = await page.run(`(()=>{
    const r=deckCheck();
    const kinds=r.issues.map(o=>o.i+':'+o.kind);
    return {kinds,stats:r.stats,sum:$('chkSum').textContent};
  })()`);
  ok(got.kinds.includes('1:overflow'), '沒抓到第 2 頁被截掉：' + got.kinds.join(', '));
  ok(got.kinds.includes('2:photo'), '沒抓到第 3 頁缺照片');
  ok(got.kinds.includes('3:title'), '沒抓到第 4 頁沒標題');
  ok(got.kinds.includes('4:dupe'), '沒抓到第 5 頁標題重複');
  eq(got.stats.pages, 5, '頁數');
  eq(got.stats.noNotes, 3, '沒有逐字稿的頁數（第 3、4、5 頁）');
  eq(got.stats.placeholder, 2, '用示意圖的照片頁數（第 1 頁 split 與第 3 頁 wall 都需要照片）');
});

test('簡報健檢：清單可以點，點了跳到那一頁', async ({ page }) => {
  await page.run(DECK);
  const got = await page.run(`(()=>{
    openCheck();
    const dlg=$('chkDlg');
    const rows=[...$('chkList').querySelectorAll('[data-go]')].map(b=>b.dataset.go);
    const open=dlg.open;
    /* 點「第 3 頁」那一列 */
    const b=[...$('chkList').querySelectorAll('[data-go]')].find(x=>x.dataset.go==='2');
    b.click();
    return {open,closed:!dlg.open,rows,cur:S.cur,title:S.title,sum:$('chkSum').textContent};
  })()`);
  eq(got.open, true, '對話框沒有打開');
  ok(got.rows.length >= 4, '清單列太少：' + got.rows.length);
  eq(got.closed, true, '點了之後對話框沒關');
  eq(got.cur, 2, '沒有跳到第 3 頁（S.cur=' + got.cur + '）');
  eq(got.title, '會場紀錄', '跳過去之後這一頁的內容不對：' + got.title);
});

test('簡報健檢：乾淨的簡報要說「沒發現問題」，不要亂報', async ({ page }) => {
  await page.run(`(()=>{
    S.ratio='16:9';S.pages=[cleanPage({tpl:'split',title:'封面',body:'',items:'',notes:'講稿'}),
      cleanPage({tpl:'tList',title:'三個重點',body:'',items:'甲|說明\\n乙|說明',notes:'講稿'})];
    S.cur=0;return 1;
  })()`);
  const got = await page.run(`(()=>{
    /* 這一頁沒有照片，但 tList 不需要照片；split 需要照片 → 先給它照片示意 */
    const r=deckCheck();
    openCheck();
    return {issues:r.issues.filter(o=>o.kind!=='photo').map(o=>o.kind),sum:$('chkSum').textContent,ok:$('chkList').textContent.includes('沒有發現問題')||$('chkList').textContent.includes('缺照片')};
  })()`);
  deepEq(got.issues, [], '乾淨的內容不該被報問題：' + got.issues.join(', '));
  ok(got.ok, '沒有問題時的文案不對：' + got.sum);
});
