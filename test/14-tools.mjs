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

test('多選頁面：切換版面尺寸後選取還在，批次套用會換成新尺寸能用的版型', async ({ page }) => {
  await page.run(DECK);
  const got = await page.run(`(()=>{
    const card=k=>document.querySelectorAll('#pages .pg')[k];
    const ev=(el,o)=>el.dispatchEvent(new MouseEvent('click',{bubbles:true,...o}));
    ev(card(0),{ctrlKey:true});ev(card(1),{ctrlKey:true});
    const before=document.querySelectorAll('#pages .pg.psel').length;
    document.querySelector('#ratioSeg button[data-v="9:16"]').click();
    const after=document.querySelectorAll('#pages .pg.psel').length;
    /* 挑一個只有 16:9 的版型，會被換成這個尺寸能用的 */
    pickTpl('mCover');
    const tpls=S.pages.map(p=>p.tpl);
    const legacy=tpls.filter(id=>!(TPLBY[id].ratios||['16:9']).includes(S.ratio));
    S.ratio='16:9';usePage(0);syncUI();drawAll();
    return {before,after,tpls,legacy,selKept:document.querySelectorAll('#pages .pg.psel').length};
  })()`);
  eq(got.before, 2, '一開始應該選了 2 頁');
  eq(got.after, 2, '切換尺寸後選取不該消失（實際 ' + got.after + '）');
  eq(got.legacy.length, 0, '批次套用後有不支援目前尺寸的版型：' + got.legacy.join(','));
  ok(got.tpls[0] === got.tpls[1], '選取的兩頁應該變成同一個版型：' + got.tpls.join(','));
  eq(got.selKept, 2, '回到 16:9 後選取也應該還在');
});

test('自訂套裝：專案檔會帶著走（存檔含 suites、載入會合併）', async ({ page }) => {
  const got = await page.run(`(()=>{
    localStorage.removeItem('lgSuites');
    /* 存檔：確認 pkg 會包含 suites（比照 projSave 的組法） */
    S.color='#112233';S.accent='#aabbcc';S.pages=[cleanPage({tpl:'cFrame',title:'封面',body:'',items:''})];S.cur=0;
    const su=saveCurrentAsSuite('專案套裝');
    const pkg={app:'ppt-layout-generator',v:3,state:{...S,pages:S.pages.map(p=>({...p}))},images:[],suites:customSuites()};
    const json=JSON.stringify(pkg);
    /* 載入：清掉再合併回來 */
    localStorage.removeItem('lgSuites');
    const back=JSON.parse(json);
    const n=mergeSuites(back.suites);
    return {n,names:customSuites().map(s=>s.name),v:back.v,suites:back.suites.length};
  })()`);
  eq(got.suites, 1, '存檔時沒有把自訂套裝放進去');
  eq(got.n, 1, '載入時沒有合併自訂套裝');
  deepEq(got.names, ['專案套裝'], '合併後清單不對');
  /* 重複匯入不該長出第二份 */
  const again = await page.run('mergeSuites(JSON.parse(localStorage.getItem("lgSuites")))');
  eq(again, 0, '同一批套裝再合併一次不該重複加入');
});

test('講者檢視：有下一頁預覽，而且帶頁名', async ({ page }) => {
  const got = await page.run(`(()=>{
    const deck={title:'T',slides:[{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',notes:'a',title:'第一頁'},
      {svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"></svg>',notes:'b',title:'第二頁'}],imgs:[]};
    const html=playerHtml(deck,{title:'T'});
    /* 講者視窗的 HTML 是包在播放器的字串裡，引號會被跳脫，所以用不會被跳脫的片段檢查 */
    return {nxt:html.includes('nxtHd')&&html.includes('下一頁'),hd:html.includes('nxtHd'),
      fill:html.includes("$('nxt').innerHTML"),title:html.includes('M.title(i+1)'),cap:html.includes('max-height:34vh')};
  })()`);
  eq(got.nxt, true, '講者視窗沒有下一頁預覽');
  eq(got.hd, true, '沒有下一頁的標題列');
  eq(got.fill, true, '沒有把下一頁畫進預覽');
  eq(got.title, true, '下一頁沒有帶頁名');
  eq(got.cap, true, '預覽沒有設高度上限（會把逐字稿擠掉）');
});
