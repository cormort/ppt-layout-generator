/* ---------- 動態效果（JS 部分）
   對應 src/style.css 最下面那一段；效果出處：kittenjam Motion Library
   #243 分段控制器、#234 按鈕漣漪、#146 按鈕載入成功、#104 卡片依序浮現。

   原則：
   1. 只用事件委派與 CSS 變數，不包裝既有函式（除了「下載」「分享」兩個明確會等的動作）。
   2. 全部遵守 prefers-reduced-motion：使用者關掉動態就什麼都不要做。
   3. 出錯不能影響主要功能——每一段都包 try/catch。 */
const MOTION_REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
const motionOK = () => !MOTION_REDUCE.matches;

/* ---------- #243 分段控制器 ---------- */
/* 滑塊畫在 .seg／.itabs 的 ::after，位置用 CSS 變數傳進去，不插 DOM 節點 */
function syncThumb(box) {
  try {
    const active = box.querySelector('button.on') || box.querySelector('button[aria-pressed="true"]') || box.querySelector('button[aria-selected="true"]');
    if (!active || !active.offsetWidth) {
      if (box.__tw !== '0px') { box.style.setProperty('--tw', '0px'); box.__tw = '0px'; }
      return;
    }
    const tw = active.offsetWidth + 'px';
    const tx = active.offsetLeft + 'px';
    if (box.__tw === tw && box.__tx === tx) return; /* 沒變就不要寫，減少樣式重算 */
    box.style.setProperty('--tw', tw);
    box.style.setProperty('--tx', tx);
    box.__tw = tw; box.__tx = tx;
  } catch (e) { /* 版面還沒好就算了 */ }
}

function syncThumbs() {
  document.querySelectorAll('.seg, .itabs').forEach(syncThumb);
}

/* 第一次定位不要有動畫（否則會從左邊滑過來） */
function primeThumbs() {
  syncThumbs();
  /* 用 setTimeout 而不是 requestAnimationFrame：分頁在背景時 rAF 不會跑，
     滑塊就永遠停在第一次的位置（實測 GitHub Pages 上就是這樣） */
  setTimeout(() => {
    document.querySelectorAll('.seg, .itabs').forEach((box) => box.classList.add('thumb-anim'));
  }, 32);
}

/** 版面常常整塊重畫（innerHTML 換掉），量一次不夠：0／120／400ms 各補一次 */
let syncTimer = 0;
function scheduleSync() {
  /* 去抖用 setTimeout，不用 rAF：分頁在背景時 rAF 會停，整個同步就卡死 */
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncThumbs, 24);
}

document.addEventListener('click', (e) => {
  const box = e.target.closest('.seg, .itabs, .tabs');
  if (!box) return;
  scheduleSync();
  setTimeout(playPane, 30);
}, true);

addEventListener('resize', () => syncThumbs(), { passive: true });

/* 分頁/選項是用 innerHTML 或 class 換的，用 MutationObserver 補同步（節流） */
let thumbTimer = 0;
const thumbObserver = new MutationObserver(() => {
  if (thumbTimer) return;
  thumbTimer = setTimeout(() => {
    thumbTimer = 0;
    document.querySelectorAll('.seg, .itabs').forEach((box) => {
      if (box.__watched) return;
      box.__watched = 1;
      try { thumbObserver.observe(box, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}
    });
    scheduleSync();
  }, 120);
});

/* ---------- #234 按鈕漣漪 ---------- */
document.addEventListener('pointerdown', (e) => {
  if (!motionOK()) return;
  const btn = e.target.closest('.btn');
  if (!btn || btn.disabled) return;
  try {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const far = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `left:${x - far}px;top:${y - far}px;width:${far * 2}px;height:${far * 2}px`;
    btn.appendChild(s);
    s.addEventListener('animationend', () => s.remove(), { once: true });
  } catch (err) { /* 不影響點擊 */ }
}, { passive: true });

/* ---------- #146 按鈕載入成功 ---------- */
function addSpin(btn) {
  if (btn.querySelector(':scope > .spin')) return;
  const wrap = document.createElement('span');
  wrap.className = 'spin';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<i></i>';
  btn.appendChild(wrap);
}

/** 按鈕進入載入狀態；完成後打勾 0.8 秒再復原。fn 回傳 Promise 才會等到結束。 */
async function busyButton(btn, fn, { hold = 800 } = {}) {
  if (!btn || btn.dataset.busy) return fn ? fn() : undefined;
  addSpin(btn);
  btn.dataset.busy = '1';
  btn.classList.add('busy');
  btn.classList.remove('done');
  try {
    const out = fn ? await fn() : undefined;
    if (motionOK()) {
      btn.classList.remove('busy');
      btn.classList.add('done');
      await new Promise((r) => setTimeout(r, hold));
    }
    return out;
  } finally {
    btn.classList.remove('busy', 'done');
    delete btn.dataset.busy;
  }
}

/* 只包「下載」「分享」這種真的要等的動作；播放是瞬間開場，不加圈圈 */
function wireBusy(id) {
  const btn = $(id);
  if (!btn) return;
  const prev = btn.onclick;
  if (typeof prev !== 'function') return;
  btn.onclick = (ev) => busyButton(btn, () => prev.call(btn, ev));
}

/* ---------- #104 卡片依序浮現 ---------- */
const seenCount = new WeakMap();

function stagger(container, selector) {
  if (!motionOK()) return;
  /* 只讓前 12 個依序出現，其餘直接顯示：56 張卡片同時上動畫只是讓低階機器卡 */
  const items = [...container.querySelectorAll(selector)].slice(0, 12);
  items.forEach((el, i) => {
    el.style.setProperty('--i', String(i));
    el.classList.remove('rise');
    void el.offsetWidth; /* 強制重排，讓同一元素再次進場也能重播 */
    el.classList.add('rise');
    el.addEventListener('animationend', () => el.classList.remove('rise'), { once: true });
  });
}

function watchCount(id, selector) {
  const box = $(id);
  if (!box) return;
  const run = () => {
    const n = box.querySelectorAll(selector).length;
    if (!n) return;
    if (seenCount.get(box) === n) return; /* 只是選取狀態改變，不要重播 */
    seenCount.set(box, n);
    stagger(box, selector);
  };
  new MutationObserver(run).observe(box, { childList: true });
  run();
}

/* 分頁切換：面板內容柔和上浮一次 */
let lastPane = null;
function playPane() {
  const pane = document.querySelector('.insp .pn.on');
  if (!pane || pane === lastPane) return;
  lastPane = pane;
  /* 剛顯示的面板裡如果有分段控制器／卡片，這時候尺寸才量得到，補一次同步與進場 */
  setTimeout(() => {
    syncThumbs();
    if (!motionOK()) return;
    if (pane.querySelector('#gal .card')) stagger(pane.querySelector('#gal'), '.card');
    if (pane.querySelector('#lib .it')) stagger(pane.querySelector('#lib'), '.it');
  }, 24);
  if (!motionOK()) return;
  pane.classList.remove('play-in');
  void pane.offsetWidth;
  pane.classList.add('play-in');
  setTimeout(() => pane.classList.remove('play-in'), 600);
}

/* ---------- 啟動 ---------- */
function initMotion() {
  try {
    primeThumbs();
    /* body 只看「有沒有新的節點」（.seg 是後來才畫出來的）；各容器只看 class 變化。
       不要盯整棵樹的屬性——每一個 class 變動都叫醒觀察器，會拖慢整個頁面。 */
    thumbObserver.observe(document.body, { childList: true, subtree: true });
    document.querySelectorAll('.seg, .itabs').forEach((box) => thumbObserver.observe(box, { attributes: true, attributeFilter: ['class'] }));
    document.querySelectorAll('.insp .pn').forEach((pn) => thumbObserver.observe(pn, { attributes: true, attributeFilter: ['class'] }));
    watchCount('gal', '.card');
    watchCount('lib', '.it');
    wireBusy('dl');
    wireBusy('share');
    playPane();
    /* 分頁按鈕一按就同步滑塊（click 事件在捕獲階段已處理，這裡補鍵盤操作） */
    addEventListener('keydown', (e) => { if (e.key === 'Tab' || e.key === 'Enter') setTimeout(() => { scheduleSync(); playPane(); }, 0); });
  } catch (e) { console.warn('motion init', e); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initMotion, { once: true });
else initMotion();
