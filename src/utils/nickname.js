import { COMMON_USAGE_CHARS, ELEGANT_CHARS, NEGATIVE_WORDS, MEME_WORDS } from './constants.js';
import { getStyleChars, getToneType, isCjk, isCjkOnly, uniqueText, getLibrary, violatesCompliance } from './chinese.js';

export function getRejectedNames(rejected) {
  return rejected.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean);
}

export function getSavedNames(rejected, favorites = []) {
  return [...new Set([...getRejectedNames(rejected), ...favorites.map((item) => item.name).filter(Boolean)])];
}

export function normalizeRejectedItem(item) {
  return typeof item === 'string' ? { name: item, total: 0, level: 'D', detail: '历史排除记录。' } : item;
}

export function estimateUsage(name, style) {
  const chars = Array.from(name);
  const styleChars = getStyleChars(style);
  const commonHits = chars.filter((char) => COMMON_USAGE_CHARS.includes(char)).length;
  const styleHits = chars.filter((char) => styleChars.includes(char)).length;
  const lengthScore = chars.length === 2 ? 28 : chars.length === 3 ? 22 : chars.length === 4 ? 14 : 8;
  const commonScore = commonHits * 12;
  const styleScore = styleHits * 7;
  const repeatPenalty = new Set(chars).size < chars.length ? 8 : 0;
  const rate = Math.max(6, Math.min(96, lengthScore + commonScore + styleScore - repeatPenalty));
  const level = rate >= 75 ? '高' : rate >= 45 ? '中' : '低';
  return {
    usageRate: rate,
    usageLevel: level,
    usageSource: '本地规则估算：基于常见汉字、风格字频、昵称长度和重复结构计算，不代表全网真实注册数量。',
  };
}

export function scoreNickname(name, requiredChar, style) {
  const chars = Array.from(name);
  const uniqueCount = new Set(chars).size;
  const hasBad = NEGATIVE_WORDS.some((word) => name.includes(word)) || violatesCompliance(name);
  if (hasBad) {
    return { total: 0, level: 'D', detail: '包含低俗、违规、仿冒或法律法规禁止的风险字词，直接判定不合格。', ...estimateUsage(name, style) };
  }

  const lengthScore = chars.length >= 2 && chars.length <= 4 ? 8 : chars.length <= 6 ? 5 : 2;
  const tones = chars.map(getToneType);
  const changes = tones.slice(1).filter((tone, index) => tone !== tones[index]).length;
  const toneScore = changes >= Math.max(1, chars.length - 2) ? 8 : changes === 0 ? 4 : 6;
  const ambiguityScore = 14;
  const strokeSpread = Math.max(...chars.map((char) => char.charCodeAt(0) % 18)) - Math.min(...chars.map((char) => char.charCodeAt(0) % 18));
  const shapeScore = strokeSpread <= 11 ? 10 : 5;
  const symbolScore = isCjkOnly(name) ? 10 : 0;
  const visualScore = uniqueCount === chars.length ? 5 : 2;
  const styleChars = getStyleChars(style);
  const styleHit = chars.filter((char) => styleChars.includes(char)).length;
  const styleScore = styleHit >= chars.length - 1 ? 10 : styleHit >= 1 ? 7 : 4;
  const imageScore = chars.some((char) => ELEGANT_CHARS.includes(char)) ? 12 : 6;
  const textureScore = chars.some((char) => '瑾瑜澜岚汐霁珩砚绾檀'.includes(char)) ? 8 : 6;
  const memoryScore = uniqueCount === chars.length && name.includes(requiredChar) ? 8 : 5;
  const sceneScore = 7;
  const repeatPenalty = uniqueCount < chars.length ? 10 : 0;
  const memePenalty = MEME_WORDS.some((word) => name.includes(word)) ? 10 : 0;
  const total = Math.max(0, Math.min(100, lengthScore + toneScore + ambiguityScore + shapeScore + symbolScore + visualScore + styleScore + imageScore + textureScore + memoryScore + sceneScore - repeatPenalty - memePenalty));
  const level = total >= 90 ? 'S' : total >= 80 ? 'A' : total >= 70 ? 'B' : total >= 60 ? 'C' : 'D';

  return {
    total,
    level,
    detail: `读音${lengthScore + toneScore + ambiguityScore}/30，视觉${shapeScore + symbolScore + visualScore}/25，意境${styleScore + imageScore + textureScore}/30，实用${memoryScore + sceneScore}/15。`,
    ...estimateUsage(name, style),
  };
}

function makeName(requiredChar, length, pool, index, fixedIndex) {
  const chars = [];
  let value = index;
  for (let position = 0; position < length; position += 1) {
    if (position === fixedIndex) {
      chars.push(requiredChar);
    } else {
      chars.push(pool[value % pool.length]);
      value = Math.floor(value / pool.length);
    }
  }
  return chars.join('');
}

export function generateNicknames({ requiredChar, length, count, style, placement }, rejected, favorites = []) {
  const cleanChar = Array.from(requiredChar).find(isCjk) || '';
  if (!cleanChar) return [];
  const pool = Array.from(uniqueText(getLibrary(style).replaceAll(cleanChar, '')));
  const result = new Map();
  const savedNames = getSavedNames(rejected, favorites);
  const targetCount = Math.max(1, Math.min(Number(count) || 120, 5000));
  const fixedIndexes = placement === '开头' ? [0] : placement === '结尾' ? [length - 1] : Array.from({ length }, (_, index) => index);
  const maxCombination = Math.min(pool.length ** Math.max(0, length - 1), targetCount + savedNames.length + 1000);

  for (const fixedIndex of fixedIndexes) {
    for (let index = 0; index < maxCombination && result.size < targetCount; index += 1) {
      const name = makeName(cleanChar, length, pool, index, fixedIndex);
      if (isCjkOnly(name) && !savedNames.includes(name) && !violatesCompliance(name)) {
        result.set(name, { name, ...scoreNickname(name, cleanChar, style) });
      }
    }
  }

  return Array.from(result.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function recordSession(store, form, count, source) {
  const session = { time: new Date().toLocaleString('zh-CN'), form: source ? { ...form, source } : form, total: count };
  return [session, ...(store.sessions || [])].slice(0, 20);
}
