/* 測試執行器：起一個本機靜態伺服器 → 開 headless Chrome → 依序跑 test/*.mjs → 彙總。
   用法：npm test  （或 node test/run.mjs）
   需要 Chrome 或 Edge；找不到時用 CHROME_PATH 指定。 */
import { readdirSync, mkdirSync, writeSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { serve } from './lib/server.mjs';
import { launch, openPage } from './lib/cdp.mjs';
import { tests, file as setFile } from './lib/check.mjs';
import { emptyDir } from './lib/fsx.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const cli = process.argv.slice(2);
/* 兩種寫法都吃：--grep 02- 與 --grep=02-（npm test -- --grep=02- 不會被 npm 拆壞） */
const grepArg = cli.find(a => a === '--grep' || a === '-g' || a.startsWith('--grep=') || a.startsWith('-g='));
const grep = !grepArg ? null
  : grepArg.includes('=') ? grepArg.slice(grepArg.indexOf('=') + 1)
    : cli[cli.indexOf(grepArg) + 1] || null;

const writeSyncStderr = m => { if (process.env.TEST_TRACE) { try { writeSync(2, '· ' + m + '\n'); } catch { } } };
const trace = writeSyncStderr;
const t0 = Date.now();
trace('start');
const server = await serve(root);
trace('server ' + server.url);
const downloads = join(here, '.downloads');
emptyDir(downloads);

const session = await launch({ downloadDir: downloads });
trace('browser launched');
const page = await openPage(session, server.url);
trace('page ready');
const ctx = { page, session, url: server.url, downloads };

const files = readdirSync(here).filter(f => /^\d\d-.*\.mjs$/.test(f)).sort();
trace('files ' + files.join(','));
for (const f of files) {
  setFile(f);
  const mod = await import(pathToFileURL(join(here, f)).href);
  trace('imported ' + f);
  if (typeof mod.default === 'function') await mod.default(ctx);
}

let pass = 0, fail = 0;
const failures = [];
for (const t of tests) {
  if (grep && !(`${t.file} ${t.name}`).includes(grep)) continue;
  trace('run ' + t.name);
  const started = Date.now();
  try {
    /* 每個測試都從乾淨狀態開始：清掉 localStorage 與 IndexedDB 再重載 */
    await page.clearStorage();
    await page.reload();
    page.clearErrors();          /* 錯誤只算這個測試造成的 */
    await t.fn(ctx);
    pass++;
    console.log(`ok   ${t.file} › ${t.name}  (${Date.now() - started}ms)`);
  } catch (e) {
    fail++;
    failures.push({ t, e });
    console.log(`FAIL ${t.file} › ${t.name}  (${Date.now() - started}ms)`);
    console.log('     ' + String(e && e.message || e).replace(/\n/g, '\n     '));
  }
}

console.log(`\n${pass} passed, ${fail} failed  (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
if (fail) {
  console.log('\n失敗的測試：');
  for (const { t } of failures) console.log(`  - ${t.file} › ${t.name}`);
}

session.close();
await server.close();
process.exit(fail ? 1 : 0);
