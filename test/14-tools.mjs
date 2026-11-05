/* 逐字稿匯出、自訂套裝匯出匯入、多選頁面批次套版型、圖庫整理。
   這四樣都是「按鈕按了但什麼都沒發生」的高風險區，所以每項都驗到資料真的變了。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const DECK = `(()=>{
  S.ratio='16:9';S.footer=false;S.logo='';S.fname='測試簡報';
  S.pages=[
    cleanPage({tpl:'split',title:'封面',body:'',items:'',notes:'各位好，今天要報告三件事。'}),
    cleanPage({tpl:'tList',title:'三個重點',body:'',items:'甲|說明一\\n乙|說明二',notes:''}),
    cleanPage({tpl:'thanks',title:'謝謝',body:'',items:'',notes:'謝謝聆聽，歡迎提問。'}),
  ];
  S.cur=0;usePage(0);syncUI();drawAll();return 1;
})()`;

test('逐字稿匯出：每頁都有頁碼、版型、字數與預估時間', async ({ page }) => {
  await page.run(DECK);
  const got = await page.run(`(()=>({md:scriptOf('md'),txt:scriptOf('txt')}))()`);
  ok(got.md.includes('# 測試簡報'), 'Markdown 缺少標題');
  ok(got.md.includes('## 第 1 頁') && got.md.includes('## 第 3 頁'), 'Markdown 缺少頁碼');
  ok(got.md.includes('各位好，今天要報告三件事。'), 'Markdown 缺少逐字稿內容');
  ok(got.md.includes('（這一頁沒有逐字稿）'), '空白頁沒有標示');
  ok(got.md.includes('共') && got.md.includes('字'), 'Markdown 缺少字數統計');
  ok(got.txt.includes('第 1 頁｜封面'), '文字檔的頁碼/標題格式不對');
  ok(!got.txt.includes('## '), '文字檔不該有 Markdown 標題');
});

test('自訂套裝：匯出的 JSON 可以再匯入回來', async ({ page }) => {
  const got = await page.run(`(async()=>{
    localStorage.removeItem('lgSuites');
    S.pages=[cleanPage({tpl:'cFrame',title:'封面',body:'',items:''})];S.cur=0;
    S.color='#224466';S.accent='#ddeeff';S.tf=3;S.bf=2;
    const su=saveCurrentAsSuite('可攜套裝');
    const json=JSON.stringify({v:1,suites:customSuites()});
    localStorage.removeItem('lgSuites');
    /* 模擬匯入：跟檔案輸入走同一段驗證 */
    const d=JSON.parse(json),add=(d.suites||[]).filter(okSuite);
    const list=customSuites();for(const s of add)if(!list.some(x=>x.id===s.id))list.push(s);
    writeCustom(list);
    return {n:add.length,back:customSuites().map(s=>s.name),bad:add.filter(s=>!okSuite(s)).length,
      roles:customSuites()[0].roles};
  })()`);
  eq(got.n, 1, '匯出的套裝數量不對');
  deepEq(got.back, ['可攜套裝'], '匯入後清單不對');
  eq(got.bad, 0, '驗證把合法套裝擋掉了');
  ok(got.roles && got.roles.cover === 'cFrame', '角色對應沒有跟著走：' + JSON.stringify(got.roles && got.roles.cover));
});

test('多選頁面：批次套版型到選取的頁，內容不動', async ({ page }) => {
  await page.run(DECK);
  const got = await page.run(`(()=>{
    /* 選第 1、2 頁（模擬 Ctrl 點擊） */
    /* 每次重畫後元素會換新，所以要重新查 */
    const card=k=>document.querySelectorAll('#pages .pg')[k];
    const ev=(el,opt)=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,...opt}));
    ev(card(0),{ctrlKey:true});ev(card(1),{ctrlKey:true});
    const barHtml=document.querySelector('#pgBar')?.textContent||'';
    const selClass=document.querySelectorAll('#pages .pg.psel').length;
    /* 用版型卡批次套用 */
    S.tpl='tQuote';pickTpl('tQuote');
    return {barHtml,selClass,tpls:S.pages.map(p=>p.tpl),titles:S.pages.map(p=>p.title),barGone:!document.querySelector('#pgBar')};
  })()`);
  ok(got.selClass === 2, '選取的頁數不對：' + got.selClass);
  ok(got.barHtml.includes('已選 2 頁'), '沒有出現批次列：' + got.barHtml);
  deepEq(got.tpls, ['tQuote', 'tQuote', 'thanks'], '批次套版型沒套到選取的頁');
  deepEq(got.titles, ['封面', '三個重點', '謝謝'], '批次套版型把內容改掉了');
});

test('圖庫整理：未使用的照片會被標記，可以只看未使用', async ({ page }) => {
  const got = await page.run(`(()=>{
    lib.length=0;sel.length=0;
    const mk=(id,name)=>({id,name,thumb:makeSamples()[0].thumb,blob:new Blob(['x'.repeat(2048)]),w:10,h:10,crop:null,cutout:false});
    lib.push(mk(101,'用到'),mk(102,'沒用到'));
    S.pages=[cleanPage({tpl:'wall',title:'頁',body:'',items:''})];
    S.pages[0].sel=[101];S.cur=0;sel.length=0;sel.push(101);
    drawLib();
    const badges=document.querySelectorAll('#lib .it.unused').length;
    const info=$('libInfo').textContent;
    libOnlyUnused=true;drawLib();
    const shown=document.querySelectorAll('#lib .it').length;
    libOnlyUnused=false;drawLib();
    return {badges,info,shown,all:document.querySelectorAll('#lib .it').length,buttons:!$('delUnsel').disabled};
  })()`);
  eq(got.badges, 1, '未使用的照片應該有 1 張被標記');
  ok(got.info.includes('1 張未使用'), '統計沒有提到未使用：' + got.info);
  eq(got.shown, 1, '「只看未使用」應該只剩 1 張');
  eq(got.all, 2, '取消篩選後應該回到 2 張');
  eq(got.buttons, true, '有未使用的照片時「移除沒用到的」要可以按');
});

test('簡報者檢視：匯出的 HTML 會帶著「一互動就開第二視窗」的旗標', async ({ page }) => {
  const got = await page.run(`(()=>{
    const deck={title:'T',slides:[{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',notes:'講稿',title:'一'}],imgs:[]};
    const a=playerHtml(deck,{title:'T'}),b=playerHtml(deck,{title:'T',pres:true});
    return {plain:/"pres":false/.test(a),pres:/"pres":true/.test(b),hasBtn:b.includes('pptgen_presenter')};
  })()`);
  eq(got.pres, true, '簡報者版的 HTML 沒帶 pres 旗標');
  eq(got.hasBtn, true, '播放器程式碼裡應該有開第二視窗的那段');
  eq(got.plain, true, '一般匯出被誤加了旗標');
});
