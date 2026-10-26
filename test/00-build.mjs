/* 建置同步：index.html 必須是 src/ 的最新產物。
   這支不需要瀏覽器，跑得很快，專門抓「改了 src/ 忘記 build」與「直接改 index.html」。 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, ok, eq } from './lib/check.mjs';
import { build } from '../build.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('index.html 與 src/ 同步（改完 src/ 要跑 node build.mjs）', async () => {
  const { html, parts } = build();
  const onDisk = readFileSync(join(root, 'index.html'), 'utf8');
  ok(onDisk === html, `index.html 不是最新的：src/ 產出 ${html.length} 字元、磁碟上 ${onDisk.length} 字元。請跑 node build.mjs`);
  eq(parts.length >= 10, true, 'JS 片段數量太少，切分可能有問題');
});

test('src/ 的每個片段都有內容，而且大小合理', async () => {
  const dir = join(root, 'src/js');
  const files = readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  eq(files.length >= 10, true, 'src/js 檔案太少');
  for (const f of files) {
    const size = statSync(join(dir, f)).size;
    ok(size > 0, `${f} 是空的`);
  }
  const css = readFileSync(join(root, 'src/style.css'), 'utf8');
  ok(css.length > 5000, `style.css 只有 ${css.length} 字元，好像不對`);
  const { jsLen } = build();
  ok(jsLen > 150000, `組出來的 JS 只有 ${jsLen} 字元，好像少了一段`);
});

test('建置產物帶著「這是產生出來的」標記', async () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  ok(html.includes('這個檔案是 node build.mjs 從 src/ 產生的'), 'index.html 少了產生標記，可能被手改成舊版了');
  ok(html.startsWith('<!doctype html>'), 'index.html 開頭不對');
  ok(html.trimEnd().endsWith('</html>'), 'index.html 結尾不對（可能被截斷）');
});
