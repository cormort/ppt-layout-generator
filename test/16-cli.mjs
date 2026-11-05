/* CLI 的 doctor：一次做完容量檢查＋健檢＋（--fix）自動修。
   這支是「命令列也要有網頁版那一輪的成果」的守門員，順便抓 flag 解析（--fix 被當成有值的參數）。 */
import { test, ok, eq, deepEq } from './lib/check.mjs';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const CLI = join(root, 'cli/pptgen.mjs');
const run = args => spawnSync(process.execPath, [CLI, ...args], {
  encoding: 'utf8', timeout: 180000,
  env: { ...process.env, CHROME_FLAGS: process.env.CHROME_FLAGS || '--no-sandbox' },
});
const BROKEN = `<!-- 版型: 文字・條列重點 -->
# 同一個標題
## 說明
- 甲|說明一
> 逐字稿。

---

<!-- 版型: 文字・條列重點 -->
# 同一個標題
## 說明
- 乙|說明二
> 逐字稿。

---

<!-- 版型: 文字・標題＋段落 -->
# 
沒有標題的頁。
> 逐字稿。
`;
const CLEAN = `<!-- 版型: 文字・條列重點 -->
# 三個重點
## 說明
- 甲|說明一
> 逐字稿。

---

<!-- 版型: 文字・標題＋段落 -->
# 結論
一句說明。
> 逐字稿。
`;

test('doctor：沒有問題時 exit 0、JSON 看得懂', async () => {
  const f = join(root, 'test/.doctor-clean.md'); writeFileSync(f, CLEAN);
  try {
    const r = run(['doctor', f, '--json']);
    eq(r.status, 0, '乾淨的大綱應該 exit 0（stderr：' + r.stderr.slice(0, 200) + '）');
    const j = JSON.parse(r.stdout);
    deepEq(j.issues, [], '不該有問題');
    eq(j.pages, 2, '頁數');
    eq(j.noNotes, 0, '逐字稿頁數');
  } finally { if (existsSync(f)) unlinkSync(f); }
});

test('doctor：有問題時 exit 1，並列出「可以自動修」', async () => {
  const f = join(root, 'test/.doctor-broken.md'); writeFileSync(f, BROKEN);
  try {
    const r = run(['doctor', f, '--json']);
    eq(r.status, 1, '有問題應該 exit 1');
    const j = JSON.parse(r.stdout);
    ok(j.byKind.dupe >= 1, '要抓到標題重複：' + JSON.stringify(j.byKind));
    ok(j.byKind.title >= 1, '要抓到沒有標題：' + JSON.stringify(j.byKind));
    ok(j.plan.length >= 2, '要提供可自動修的清單：' + JSON.stringify(j.plan));
    ok(j.plan.some(x => x.includes('（續）')), '重複標題的修法要加上（續）');
  } finally { if (existsSync(f)) unlinkSync(f); }
});

test('doctor --fix：修好、存成新檔，原檔不動', async () => {
  const f = join(root, 'test/.doctor-fix.md'), o = join(root, 'test/.doctor-fixed.md');
  writeFileSync(f, BROKEN);
  try {
    const r = run(['doctor', f, '--fix', '-o', o, '--json']);
    const j = JSON.parse(r.stdout);
    ok(j.fixed.length >= 2, '--fix 應該修掉兩項：' + JSON.stringify(j.fixed));
    eq(j.issues.length, 0, '修完應該沒有問題了：' + JSON.stringify(j.issues));
    eq(r.status, 0, '修完 exit 0');
    ok(existsSync(o), '沒有存成檔案：' + o);
    const fixed = readFileSync(o, 'utf8');
    ok(fixed.includes('同一個標題（續）'), '第二頁沒有改名：' + fixed.slice(0, 200));
    eq(readFileSync(f, 'utf8'), BROKEN, '原檔不該被動到');
  } finally {
    for (const x of [f, o]) if (existsSync(x)) unlinkSync(x);
  }
});
