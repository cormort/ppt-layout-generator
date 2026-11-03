/* 花瓣扇版型：花瓣數跟著照片走、一片花瓣一張照片、範圍沒有 NaN、文字全都畫得出來。
   這支是為了「照片被塞進不該放的地方」「整朵花用同一張裁切，看不出來」這類靜默失敗而寫的。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';

const RESET = `(()=>{S.ratio='16:9';S.fs=100;S.footer=false;S.logo='';S.single=false;
  S.title='萬物生紋';S.subtitle='MASTERPIECE';S.body='在一羽一翼的細微處，大自然早已完成了她的寫生。';
  S.items='';S.tpl='petalFan';return 1})()`;

/* 每個尺寸都畫得出來、沒有 NaN、文字全在畫布內 */
test('花瓣扇：每個尺寸都畫得出來，文字不出畫布', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const cols=['#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0'];
    const mk=k=>cols.slice(0,k).map((c,i)=>{
      const cv=document.createElement('canvas');cv.width=400;cv.height=300;
      const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,400,300);
      return {src:cv.toDataURL(),w:400,h:300};
    });
    const out={problems:[],perRatio:{}};
    for(const ratio of Object.keys(RATIOS)){
      S.ratio=ratio;const [rw,rh]=RATIOS[ratio];
      const svg=renderSVG(TPLBY.petalFan,mk(6),'pf'+ratio.replace(':','')+'_');
      out.perRatio[ratio]=(svg.match(/stroke-linejoin="round"/g)||[]).length;
      if(/NaN|Infinity/.test(svg))out.problems.push(ratio+' 出現 NaN');
      if(!svg.includes('viewBox="0 0 '+rw+' '+rh+'"'))out.problems.push(ratio+' viewBox 不對');
      for(const s of ['萬物生紋','MASTERPIECE','一羽一翼']){
        if(!svg.includes(s))out.problems.push(ratio+' 少了「'+s+'」');
      }
    }
    S.ratio='16:9';
    return out;
  })()`);
  eq(got.problems.length, 0, '花瓣扇問題：\n      ' + got.problems.join('\n      '));
  for (const r of ['16:9', '1:1', '4:5', '3:4', '9:16']) eq(got.perRatio[r], 6, `${r} 的花瓣數`);
});

/* 花瓣數＝照片數（5–8），1 張照片時固定 7 片花瓣各裁一部分 */
test('花瓣扇：花瓣數跟著照片走（5–8 片），只有 1 張時 7 片', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const mk=k=>[...Array(k)].map((_,i)=>{
      const cv=document.createElement('canvas');cv.width=400;cv.height=300;
      const x=cv.getContext('2d');x.fillStyle='hsl('+(i*47)+',70%,55%)';x.fillRect(0,0,400,300);
      return {src:cv.toDataURL(),w:400,h:300};
    });
    const count=n=>{
      S.single=n===1;
      const svg=renderSVG(TPLBY.petalFan,mk(n),'n'+n+'_');
      return (svg.match(/stroke-linejoin="round"/g)||[]).length;
    };
    return {one:count(1),two:count(2),five:count(5),six:count(6),eight:count(8),ten:count(10)};
  })()`);
  deepEq(got, { one: 7, two: 5, five: 5, six: 6, eight: 8, ten: 8 }, '花瓣數');
});

/* 每片花瓣各自放自己的照片（不是整朵花一張圖），而且落在花瓣自己的範圍裡 */
test('花瓣扇：一片花瓣一張照片', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    const cols=['#ff0000','#00ff00','#0000ff','#ffff00','#ff00ff','#00ffff'];
    const imgs=cols.map(c=>{
      const cv=document.createElement('canvas');cv.width=400;cv.height=400;
      const x=cv.getContext('2d');x.fillStyle=c;x.fillRect(0,0,400,400);
      return {src:cv.toDataURL(),w:400,h:400};
    });
    const svg=renderSVG(TPLBY.petalFan,imgs,'one_');
    /* 每個 clipPath 各自一片花瓣：clipPath 的數量要跟花瓣一樣多（外加背景與整頁兩個） */
    const clips=[...svg.matchAll(/<clipPath id="([^"]+)"><path d="([^"]+)" transform="translate\\(([^)]+)\\)/g)];
    const pathes=[...svg.matchAll(/<path d="M0,0Q[^"]*" transform="translate\\(([^)]*)\\) rotate\\(([^)]*)\\)" fill="#ffffff"/g)];
    /* 每張照片的顯示範圍必須是正數、而且在畫布上看得到 */
    const boxes=[...svg.matchAll(/<svg x="([-\\d.]+)" y="([-\\d.]+)" width="([-\\d.]+)" height="([-\\d.]+)"/g)]
      .map(m=>({x:+m[1],y:+m[2],w:+m[3],h:+m[4]}));
    return {
      petals:pathes.length,clips:clips.length,
      imgs:boxes.length,
      bad:boxes.filter(b=>!(b.w>20&&b.h>20)).length,
      inside:boxes.filter(b=>b.x> -900&&b.y> -900&&b.x<3000&&b.y<2000).length
    };
  })()`);
  eq(got.petals, 6, '白色花瓣數');
  eq(got.clips, 6, 'clipPath 數');
  eq(got.imgs, 6, '照片數');
  eq(got.bad, 0, '有照片的顯示範圍是空的');
  eq(got.inside, 6, '有照片被丟到畫布外');
});

/* 只管照片與標題時也不能爆掉（沒有副標、沒有內文） */
test('花瓣扇：只有標題也畫得出來', async ({ page }) => {
  await page.run(RESET);
  const got = await page.run(`(()=>{
    S.subtitle='';S.body='';
    const cv=document.createElement('canvas');cv.width=400;cv.height=300;
    cv.getContext('2d').fillRect(0,0,400,300);
    const svg=renderSVG(TPLBY.petalFan,[{src:cv.toDataURL(),w:400,h:300}],'only_');
    return {nan:/NaN|Infinity/.test(svg),note:overflowNote(svg),title:svg.includes('萬物生紋')};
  })()`);
  eq(got.nan, false, '只有標題時出現 NaN');
  eq(got.title, true, '標題不見了');
  eq(got.note, '', '只有標題時誤報放不下：' + got.note);
});
