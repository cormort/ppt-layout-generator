/* 測試註冊與斷言：不引入測試框架，輸出 TAP 風格的行，失敗時 exit 1。 */
export const tests = [];
let currentFile = '';

export function file(name) { currentFile = name; }
export function test(name, fn) { tests.push({ file: currentFile, name, fn }); }

export function ok(cond, msg) { if (!cond) throw new Error(msg || '預期為真'); }
export function eq(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || '值不相等'}：預期 ${JSON.stringify(expected)}，實際 ${JSON.stringify(actual)}`);
}
export function near(actual, expected, tol, msg) {
  if (Math.abs(actual - expected) > tol) throw new Error(`${msg || '值超出容許範圍'}：預期 ${expected}±${tol}，實際 ${actual}`);
}
export function deepEq(actual, expected, msg) {
  const a = JSON.stringify(actual), b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${msg || '結構不相等'}：預期 ${b}，實際 ${a}`);
}
export function includes(list, value, msg) {
  if (!Array.isArray(list) || !list.includes(value)) throw new Error(`${msg || '清單缺少項目'}：找不到 ${JSON.stringify(value)}`);
}
export function noErrors(errors, msg) {
  if (errors && errors.length) throw new Error(`${msg || '頁面有錯誤'}：\n    ` + errors.map(e => `[${e.kind}] ${e.text.split('\n')[0]}`).join('\n    '));
}
