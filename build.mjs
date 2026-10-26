/* 把 src/ 組成單一的 index.html。
   零依賴、不需要任何工具：`node build.mjs` 就是把 src/shell.html 的兩個佔位符換掉。

   src/shell.html   HTML 骨架（含 CSS／JS 佔位符）
   src/style.css    <style> 的內容
   src/js/*.js      依檔名排序串成一支 <script>（同一支 script 內的 const／let 才是同一個作用域）

   用法：
     node build.mjs            產生 index.html
     node build.mjs --check    只檢查 index.html 是否與 src/ 同步（不同步就 exit 1，給測試與 CI 用） */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)));
const read = p => readFileSync(p, 'utf8');

export function build() {
  const shellPath = join(root, 'src/shell.html');
  if (!existsSync(shellPath)) throw new Error('找不到 src/shell.html');
  const shell = read(shellPath);
  const css = read(join(root, 'src/style.css'));
  const dir = join(root, 'src/js');
  const parts = readdirSync(dir).filter(f => f.endsWith('.js')).sort();
  if (!parts.length) throw new Error('src/js 沒有內容');
  const js = parts.map(f => read(join(dir, f))).join('');

  if (!shell.includes('/*@CSS@*/') || !shell.includes('/*@JS@*/')) throw new Error('shell.html 缺少 /*@CSS@*/ 或 /*@JS@*/ 佔位符');
  return { html: shell.replace('/*@CSS@*/', () => css).replace('/*@JS@*/', () => js), parts, cssLen: css.length, jsLen: js.length };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === join(process.argv[1]);
if (isMain) {
  const out = build();
  const target = join(root, 'index.html');
  const check = process.argv.includes('--check');
  const current = existsSync(target) ? read(target) : '';
  if (check) {
    if (current === out.html) {
      console.log(`index.html 與 src/ 同步（${out.parts.length} 個 JS 片段，${(out.html.length / 1024).toFixed(0)} KB）`);
    } else {
      console.error('index.html 與 src/ 不同步：請跑 node build.mjs');
      process.exit(1);
    }
  } else {
    const changed = current !== out.html;
    writeFileSync(target, out.html, 'utf8');
    console.log(`已產生 index.html：${(out.html.length / 1024).toFixed(0)} KB`
      + `（CSS ${(out.cssLen / 1024).toFixed(1)} KB、JS ${(out.jsLen / 1024).toFixed(1)} KB、${out.parts.length} 個片段）`
      + (changed ? '' : ' — 內容沒有變'));
  }
}
