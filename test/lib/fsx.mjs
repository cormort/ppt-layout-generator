/* 檔案操作helper。
   注意：這台機器上 fs.rmSync（含 recursive、甚至只刪一個檔案）會讓 Node 直接 fast-fail
   （exit 0xC0000409，沒有任何訊息），所以一律用 unlinkSync / rmdirSync 自己走訪。 */
import { existsSync, statSync, readdirSync, unlinkSync, rmdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export function removeTree(p) {
  if (!existsSync(p)) return;
  if (!statSync(p).isDirectory()) { unlinkSync(p); return; }
  for (const name of readdirSync(p)) removeTree(join(p, name));
  rmdirSync(p);
}

export function emptyDir(p) {
  mkdirSync(p, { recursive: true });
  for (const name of readdirSync(p)) removeTree(join(p, name));
}
