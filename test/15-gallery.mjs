/* 版型庫的「最近」「收藏」：星號要記住、清單要跟著變、不要跟「套用版型」打架。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

test('收藏：星號可以加／取消，收藏分類會跟著變', async ({ page }) => {
  const got = await page.run(`(()=>{
    localStorage.removeItem('lgFav');localStorage.removeItem('lgRecent');
    S.cat='all';drawFilters();drawGallery(true);
    const card=$('gal').querySelector('.card');
    const id=card.dataset.id;
    card.querySelector('.fav').click();
    const fav1=favIds(),pressed1=card.querySelector('.fav').getAttribute('aria-pressed');
    /* 切到收藏分類，應該只剩那一張 */
    S.cat='fav';drawFilters();drawGallery(true);
    const inFav=S.cat==='fav'?[...$('gal').querySelectorAll('.card')].map(c=>c.dataset.id):[];
    /* 再點一次取消 */
    const c2=$('gal').querySelector('.card');c2.querySelector('.fav').click();
    const fav2=favIds();
    S.cat='all';drawFilters();drawGallery(true);
    return {id,fav1,pressed1,inFav,fav2};
  })()`);
  deepEq(got.fav1, [got.id], '按星號沒有加進收藏');
  eq(got.pressed1, 'true', 'aria-pressed 沒有同步');
  deepEq(got.inFav, [got.id], '收藏分類沒有列出收藏的版型');
  deepEq(got.fav2, [], '再按一次沒有取消收藏');
});

test('最近使用：套用過的版型會出現在最前面（最多 8 個、不重複）', async ({ page }) => {
  const got = await page.run(`(()=>{
    localStorage.removeItem('lgRecent');
    S.ratio='16:9';S.pages=[cleanPage({tpl:'cFrame',title:'封面',body:'',items:''})];S.cur=0;usePage(0);
    ['tList','cBar','tList','wall'].forEach(id=>pickTpl(id));
    const r1=recentIds();
    for(const t of TPL.slice(0,12))rememberTpl(t.id);
    const r2=recentIds();
    S.cat='recent';drawFilters();drawGallery(true);
    const shown=[...$('gal').querySelectorAll('.card')].map(c=>c.dataset.id);
    const expected=r2.filter(id=>(TPLBY[id].ratios||['16:9']).includes('16:9'));
    S.cat='all';drawFilters();drawGallery(true);
    return {r1,r2,shown,expected,len2:r2.length,uniq:new Set(r2).size};
  })()`);
  deepEq(got.r1, ['wall', 'tList', 'cBar'], '最近使用沒有照時間排序、也不該重複：' + got.r1.join(','));
  ok(got.len2 <= 8, '最近使用最多存 8 個（實際 ' + got.len2 + '）');
  eq(got.len2, got.uniq, '最近使用有重複');
  deepEq(got.shown, got.expected, '最近分類列出的順序要跟記錄一致');
});

test('按星號不會套用版型（不會改到目前這一頁）', async ({ page }) => {
  const got = await page.run(`(()=>{
    localStorage.removeItem('lgFav');
    S.ratio='16:9';S.pages=[cleanPage({tpl:'cFrame',title:'封面',body:'',items:''})];S.cur=0;usePage(0);syncUI();drawAll();
    S.cat='all';drawFilters();drawGallery(true);
    const before=S.pages[0].tpl;
    const card=[...$('gal').querySelectorAll('.card')].find(c=>c.dataset.id!==before);
    card.querySelector('.fav').click();
    return {before,after:S.pages[0].tpl,cur:S.tpl};
  })()`);
  eq(got.after, got.before, '按星號不該改到頁面的版型');
  eq(got.cur, got.before, '按星號不該改到目前版型');
});
