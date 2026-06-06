import { CUTE_CHARS, COOL_CHARS, ELEGANT_CHARS, FULL_CHINESE_CHARS, PROHIBITED_TERMS } from './constants.js';

const CJK_CHAR_RE = /[\u4e00-\u9fff]/;
const CJK_ONLY_RE = /^[\u4e00-\u9fff]+$/;

export function isCjk(char) {
  return CJK_CHAR_RE.test(char);
}

export function isCjkOnly(text) {
  return CJK_ONLY_RE.test(text);
}

export function uniqueText(text) {
  return Array.from(new Set(Array.from(text).filter(isCjk))).join('');
}

export function getStyleChars(style) {
  if (style === '可爱') return CUTE_CHARS;
  if (style === '清冷') return COOL_CHARS;
  return ELEGANT_CHARS;
}

export function getLibrary(style) {
  if (style === '可爱') return uniqueText(CUTE_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '清冷') return uniqueText(COOL_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '古风') return uniqueText(ELEGANT_CHARS + COOL_CHARS + CUTE_CHARS + FULL_CHINESE_CHARS);
  return uniqueText(ELEGANT_CHARS + CUTE_CHARS + COOL_CHARS + FULL_CHINESE_CHARS);
}

export function violatesCompliance(name) {
  return PROHIBITED_TERMS.some((word) => name.includes(word));
}

export function getToneType(char) {
  const level = '妈麻花家云风清初书知春东南西苏栀安宁星青听舟川汐霜秋';
  const oblique = '月雪雨浅澜岚晚梦鹿鹤墨锦念沐洛棠瑾瑜若夜凛烬渡野序';
  if (level.includes(char)) return '平';
  if (oblique.includes(char)) return '仄';
  return char.charCodeAt(0) % 2 === 0 ? '平' : '仄';
}
