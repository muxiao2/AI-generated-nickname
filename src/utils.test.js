import { describe, it, expect } from 'vitest';
import {
  ELEGANT_CHARS, CUTE_CHARS, COOL_CHARS, NEGATIVE_WORDS, MEME_WORDS,
  COMMON_USAGE_CHARS, PROHIBITED_TERMS, COMPLIANCE_RULES, STORAGE_KEY,
  AI_PRESETS, DEFAULT_AI_CONFIG, AI_CRITERIA_PROMPT, FULL_CHINESE_CHARS,
  uniqueText, getLibrary, getRejectedNames, getSavedNames,
  getToneType, violatesCompliance, estimateUsage, scoreNickname,
  makeName, generateNicknames, buildAiPrompt, parseAiNames,
} from './utils.js';

// ─── Constants ───────────────────────────────────────────────────────────────

describe('constants', () => {
  it('ELEGANT_CHARS contains only CJK characters', () => {
    for (const ch of ELEGANT_CHARS) {
      expect(ch).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('CUTE_CHARS contains only CJK characters', () => {
    for (const ch of CUTE_CHARS) {
      expect(ch).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('COOL_CHARS contains only CJK characters', () => {
    for (const ch of COOL_CHARS) {
      expect(ch).toMatch(/[\u4e00-\u9fff]/);
    }
  });

  it('FULL_CHINESE_CHARS covers the full CJK Unified Ideographs range', () => {
    expect(FULL_CHINESE_CHARS.length).toBe(0x9fff - 0x4e00 + 1);
    expect(FULL_CHINESE_CHARS[0]).toBe('\u4e00');
    expect(FULL_CHINESE_CHARS[FULL_CHINESE_CHARS.length - 1]).toBe('\u9fff');
  });

  it('STORAGE_KEY is a non-empty string', () => {
    expect(STORAGE_KEY).toBe('hanzi-nickname-studio-v1');
  });

  it('AI_PRESETS has OpenAI and DeepSeek entries', () => {
    expect(AI_PRESETS.OpenAI.endpoint).toContain('openai.com');
    expect(AI_PRESETS.DeepSeek.endpoint).toContain('deepseek.com');
  });

  it('DEFAULT_AI_CONFIG defaults to DeepSeek', () => {
    expect(DEFAULT_AI_CONFIG.provider).toBe('DeepSeek');
    expect(DEFAULT_AI_CONFIG.apiKey).toBe('');
  });

  it('COMPLIANCE_RULES is a non-empty array of strings', () => {
    expect(COMPLIANCE_RULES.length).toBeGreaterThan(0);
    for (const rule of COMPLIANCE_RULES) {
      expect(typeof rule).toBe('string');
    }
  });

  it('AI_CRITERIA_PROMPT contains scoring criteria', () => {
    expect(AI_CRITERIA_PROMPT).toContain('读音韵律');
    expect(AI_CRITERIA_PROMPT).toContain('视觉排版');
  });
});

// ─── uniqueText ──────────────────────────────────────────────────────────────

describe('uniqueText', () => {
  it('keeps only CJK characters and deduplicates', () => {
    expect(uniqueText('abc月月星123')).toBe('月星');
  });

  it('returns empty string for non-CJK input', () => {
    expect(uniqueText('hello world 123')).toBe('');
  });

  it('preserves order of first occurrence', () => {
    expect(uniqueText('星月星云月')).toBe('星月云');
  });

  it('handles empty string', () => {
    expect(uniqueText('')).toBe('');
  });

  it('filters mixed content correctly', () => {
    expect(uniqueText('A云B月C星D')).toBe('云月星');
  });
});

// ─── getLibrary ──────────────────────────────────────────────────────────────

describe('getLibrary', () => {
  it('returns a string of unique CJK characters for 可爱 style', () => {
    const lib = getLibrary('可爱');
    expect(lib.length).toBeGreaterThan(0);
    expect(new Set(Array.from(lib)).size).toBe(lib.length);
  });

  it('returns a string of unique CJK characters for 清冷 style', () => {
    const lib = getLibrary('清冷');
    expect(lib.length).toBeGreaterThan(0);
  });

  it('returns a string of unique CJK characters for 古风 style', () => {
    const lib = getLibrary('古风');
    expect(lib.length).toBeGreaterThan(0);
  });

  it('returns a string for 综合 or any other style', () => {
    const lib = getLibrary('综合');
    expect(lib.length).toBeGreaterThan(0);
  });

  it('prioritizes style-specific characters at the beginning', () => {
    const cuteLib = getLibrary('可爱');
    const firstChar = cuteLib[0];
    expect(CUTE_CHARS).toContain(firstChar);
  });

  it('prioritizes cool characters for 清冷 style', () => {
    const coolLib = getLibrary('清冷');
    const firstChar = coolLib[0];
    expect(COOL_CHARS).toContain(firstChar);
  });
});

// ─── getRejectedNames ────────────────────────────────────────────────────────

describe('getRejectedNames', () => {
  it('extracts names from string items', () => {
    expect(getRejectedNames(['云月', '星雪'])).toEqual(['云月', '星雪']);
  });

  it('extracts names from object items', () => {
    expect(getRejectedNames([{ name: '云月' }, { name: '星雪' }])).toEqual(['云月', '星雪']);
  });

  it('handles mixed string and object items', () => {
    expect(getRejectedNames(['云月', { name: '星雪' }])).toEqual(['云月', '星雪']);
  });

  it('filters out falsy names', () => {
    expect(getRejectedNames([{ name: '' }, { name: null }, '云月'])).toEqual(['云月']);
  });

  it('returns empty array for empty input', () => {
    expect(getRejectedNames([])).toEqual([]);
  });
});

// ─── getSavedNames ───────────────────────────────────────────────────────────

describe('getSavedNames', () => {
  it('combines rejected and favorite names without duplicates', () => {
    const rejected = ['云月'];
    const favorites = [{ name: '云月' }, { name: '星雪' }];
    const result = getSavedNames(rejected, favorites);
    expect(result).toContain('云月');
    expect(result).toContain('星雪');
    expect(result.filter((n) => n === '云月').length).toBe(1);
  });

  it('handles empty favorites', () => {
    expect(getSavedNames(['云月'])).toEqual(['云月']);
  });

  it('handles empty rejected', () => {
    const result = getSavedNames([], [{ name: '星雪' }]);
    expect(result).toEqual(['星雪']);
  });

  it('handles both empty', () => {
    expect(getSavedNames([], [])).toEqual([]);
  });

  it('filters out items with no name', () => {
    const result = getSavedNames([{ name: '' }], [{ name: null }]);
    expect(result).toEqual([]);
  });
});

// ─── getToneType ─────────────────────────────────────────────────────────────

describe('getToneType', () => {
  it('returns 平 for level-tone characters', () => {
    expect(getToneType('云')).toBe('平');
    expect(getToneType('风')).toBe('平');
    expect(getToneType('清')).toBe('平');
    expect(getToneType('安')).toBe('平');
  });

  it('returns 仄 for oblique-tone characters', () => {
    expect(getToneType('月')).toBe('仄');
    expect(getToneType('雪')).toBe('仄');
    expect(getToneType('梦')).toBe('仄');
    expect(getToneType('夜')).toBe('仄');
  });

  it('falls back to charCode-based heuristic for unknown characters', () => {
    const result = getToneType('龙');
    expect(['平', '仄']).toContain(result);
  });

  it('returns consistent results for the same character', () => {
    const first = getToneType('龙');
    const second = getToneType('龙');
    expect(first).toBe(second);
  });
});

// ─── violatesCompliance ──────────────────────────────────────────────────────

describe('violatesCompliance', () => {
  it('returns true for names containing prohibited terms', () => {
    expect(violatesCompliance('云国家月')).toBe(true);
    expect(violatesCompliance('政府星')).toBe(true);
    expect(violatesCompliance('新闻云')).toBe(true);
  });

  it('returns false for clean names', () => {
    expect(violatesCompliance('云月星')).toBe(false);
    expect(violatesCompliance('清风明月')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(violatesCompliance('')).toBe(false);
  });

  it('detects all prohibited terms', () => {
    for (const term of PROHIBITED_TERMS) {
      expect(violatesCompliance(`前${term}后`)).toBe(true);
    }
  });
});

// ─── estimateUsage ───────────────────────────────────────────────────────────

describe('estimateUsage', () => {
  it('returns an object with usageRate, usageLevel, and usageSource', () => {
    const result = estimateUsage('云月', '古风');
    expect(result).toHaveProperty('usageRate');
    expect(result).toHaveProperty('usageLevel');
    expect(result).toHaveProperty('usageSource');
  });

  it('clamps usageRate between 6 and 96', () => {
    const result = estimateUsage('龘龘龘龘龘龘', '古风');
    expect(result.usageRate).toBeGreaterThanOrEqual(6);
    expect(result.usageRate).toBeLessThanOrEqual(96);
  });

  it('assigns higher rate for 2-character names with common chars', () => {
    const short = estimateUsage('云月', '古风');
    const long = estimateUsage('龘龘龘龘', '古风');
    expect(short.usageRate).toBeGreaterThan(long.usageRate);
  });

  it('applies repeat penalty for duplicate characters', () => {
    const unique = estimateUsage('云月', '古风');
    const repeated = estimateUsage('云云', '古风');
    expect(unique.usageRate).toBeGreaterThan(repeated.usageRate);
  });

  it('assigns usageLevel based on rate thresholds', () => {
    const high = estimateUsage('小月', '可爱');
    expect(['高', '中', '低']).toContain(high.usageLevel);
  });

  it('uses style-specific chars for scoring', () => {
    const cute = estimateUsage('小兔', '可爱');
    const cool = estimateUsage('小兔', '清冷');
    expect(cute.usageRate).not.toBe(cool.usageRate);
  });

  it('includes usageSource describing local estimation', () => {
    const result = estimateUsage('云月', '古风');
    expect(result.usageSource).toContain('本地规则估算');
  });
});

// ─── scoreNickname ───────────────────────────────────────────────────────────

describe('scoreNickname', () => {
  it('returns 0 total for names with negative words', () => {
    const result = scoreNickname('丑云', '云', '古风');
    expect(result.total).toBe(0);
    expect(result.level).toBe('D');
  });

  it('returns 0 total for names violating compliance', () => {
    const result = scoreNickname('云政府', '云', '古风');
    expect(result.total).toBe(0);
    expect(result.level).toBe('D');
  });

  it('returns a valid score for clean names', () => {
    const result = scoreNickname('云月星', '月', '古风');
    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(['S', 'A', 'B', 'C', 'D']).toContain(result.level);
  });

  it('includes detail breakdown', () => {
    const result = scoreNickname('云月星', '月', '古风');
    expect(result.detail).toContain('读音');
    expect(result.detail).toContain('视觉');
    expect(result.detail).toContain('意境');
    expect(result.detail).toContain('实用');
  });

  it('includes usage estimation fields', () => {
    const result = scoreNickname('云月星', '月', '古风');
    expect(result).toHaveProperty('usageRate');
    expect(result).toHaveProperty('usageLevel');
    expect(result).toHaveProperty('usageSource');
  });

  it('penalizes names with meme words', () => {
    const normal = scoreNickname('云月星', '月', '古风');
    const meme = scoreNickname('非主流月', '月', '古风');
    expect(meme.total).toBeLessThan(normal.total);
  });

  it('penalizes repeated characters', () => {
    const unique = scoreNickname('云月星', '月', '古风');
    const repeated = scoreNickname('月月月', '月', '古风');
    expect(repeated.total).toBeLessThan(unique.total);
  });

  it('scores pure CJK names higher on symbol score', () => {
    const result = scoreNickname('云月', '月', '古风');
    expect(result.total).toBeGreaterThan(0);
  });

  it('assigns correct grade levels', () => {
    const result90 = scoreNickname('瑾瑜汐', '瑾', '古风');
    expect(['S', 'A', 'B', 'C', 'D']).toContain(result90.level);
  });

  it('awards higher memory score when required char is present and all unique', () => {
    const withChar = scoreNickname('云月星', '月', '古风');
    const withoutChar = scoreNickname('云风星', '月', '古风');
    expect(withChar.total).toBeGreaterThanOrEqual(withoutChar.total);
  });
});

// ─── makeName ────────────────────────────────────────────────────────────────

describe('makeName', () => {
  it('places required char at the fixed index', () => {
    const pool = Array.from('云星雪');
    const name = makeName('月', 3, pool, 0, 1);
    expect(name[1]).toBe('月');
    expect(name.length).toBe(3);
  });

  it('places required char at position 0', () => {
    const pool = Array.from('云星雪');
    const name = makeName('月', 3, pool, 0, 0);
    expect(name[0]).toBe('月');
  });

  it('places required char at last position', () => {
    const pool = Array.from('云星雪');
    const name = makeName('月', 3, pool, 0, 2);
    expect(name[2]).toBe('月');
  });

  it('generates different names for different indexes', () => {
    const pool = Array.from('云星雪风');
    const name1 = makeName('月', 3, pool, 0, 0);
    const name2 = makeName('月', 3, pool, 1, 0);
    expect(name1).not.toBe(name2);
  });

  it('wraps around the pool correctly', () => {
    const pool = Array.from('云星');
    const name = makeName('月', 3, pool, 0, 0);
    expect(name.length).toBe(3);
    expect(pool).toContain(name[1]);
    expect(pool).toContain(name[2]);
  });

  it('handles single-character names', () => {
    const pool = Array.from('云星');
    const name = makeName('月', 1, pool, 0, 0);
    expect(name).toBe('月');
  });
});

// ─── generateNicknames ───────────────────────────────────────────────────────

describe('generateNicknames', () => {
  it('returns empty array for non-CJK required char', () => {
    const result = generateNicknames({ requiredChar: 'A', length: 3, count: 10, style: '古风', placement: '任意' }, []);
    expect(result).toEqual([]);
  });

  it('returns empty array for empty required char', () => {
    const result = generateNicknames({ requiredChar: '', length: 3, count: 10, style: '古风', placement: '任意' }, []);
    expect(result).toEqual([]);
  });

  it('generates nicknames containing the required character', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '任意' }, []);
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      expect(item.name).toContain('月');
    }
  });

  it('generates nicknames of the specified length', () => {
    const result = generateNicknames({ requiredChar: '月', length: 4, count: 5, style: '古风', placement: '任意' }, []);
    for (const item of result) {
      expect(Array.from(item.name).length).toBe(4);
    }
  });

  it('respects placement=开头', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '开头' }, []);
    for (const item of result) {
      expect(Array.from(item.name)[0]).toBe('月');
    }
  });

  it('respects placement=结尾', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '结尾' }, []);
    for (const item of result) {
      const chars = Array.from(item.name);
      expect(chars[chars.length - 1]).toBe('月');
    }
  });

  it('excludes rejected names', () => {
    const first = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '开头' }, []);
    const rejectedName = first[0].name;
    const second = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '开头' }, [rejectedName]);
    expect(second.map((item) => item.name)).not.toContain(rejectedName);
  });

  it('excludes favorite names', () => {
    const first = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '开头' }, []);
    const favName = first[0].name;
    const second = generateNicknames({ requiredChar: '月', length: 3, count: 5, style: '古风', placement: '开头' }, [], [{ name: favName }]);
    expect(second.map((item) => item.name)).not.toContain(favName);
  });

  it('returns results sorted by score descending', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 20, style: '古风', placement: '任意' }, []);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].total).toBeGreaterThanOrEqual(result[i].total);
    }
  });

  it('does not exceed the requested count', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '开头' }, []);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('each result has required score fields', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 3, style: '古风', placement: '开头' }, []);
    for (const item of result) {
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('total');
      expect(item).toHaveProperty('level');
      expect(item).toHaveProperty('detail');
      expect(item).toHaveProperty('usageRate');
    }
  });

  it('generates only pure CJK names', () => {
    const result = generateNicknames({ requiredChar: '月', length: 3, count: 50, style: '古风', placement: '任意' }, []);
    for (const item of result) {
      expect(item.name).toMatch(/^[\u4e00-\u9fff]+$/);
    }
  });
});

// ─── buildAiPrompt ───────────────────────────────────────────────────────────

describe('buildAiPrompt', () => {
  it('includes the required character in the prompt', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '任意' }, []);
    expect(prompt).toContain('月');
  });

  it('includes the style in the prompt', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '清冷', placement: '任意' }, []);
    expect(prompt).toContain('清冷');
  });

  it('includes the length in the prompt', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 4, count: 10, style: '古风', placement: '任意' }, []);
    expect(prompt).toContain('4');
  });

  it('includes rejected names in the prompt', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '任意' }, ['云月星']);
    expect(prompt).toContain('云月星');
  });

  it('includes scoring criteria', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '任意' }, []);
    expect(prompt).toContain('读音韵律');
    expect(prompt).toContain('视觉排版');
  });

  it('caps count at 80', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 200, style: '古风', placement: '任意' }, []);
    expect(prompt).toContain('80');
    expect(prompt).not.toContain('200');
  });

  it('defaults count to 20 for NaN input', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: NaN, style: '古风', placement: '任意' }, []);
    expect(prompt).toContain('20');
  });

  it('includes placement in the prompt', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '开头' }, []);
    expect(prompt).toContain('开头');
  });

  it('shows 无 when no rejected/favorites', () => {
    const prompt = buildAiPrompt({ requiredChar: '月', length: 3, count: 10, style: '古风', placement: '任意' }, [], []);
    expect(prompt).toContain('无');
  });
});

// ─── parseAiNames ────────────────────────────────────────────────────────────

describe('parseAiNames', () => {
  it('parses valid JSON array of nicknames', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 85, level: 'A', detail: '读音28/30，视觉20/25，意境25/30，实用12/15。', usageRate: 45, usageLevel: '中' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('云月星');
    expect(result[0].total).toBe(85);
    expect(result[0].level).toBe('A');
  });

  it('strips markdown code fences', () => {
    const json = '```json\n' + JSON.stringify([{ name: '云月星', total: 80, level: 'A' }]) + '\n```';
    const result = parseAiNames(json, '古风');
    expect(result.length).toBe(1);
  });

  it('filters out non-CJK names', () => {
    const json = JSON.stringify([
      { name: 'hello', total: 80, level: 'A' },
      { name: '云月星', total: 80, level: 'A' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('云月星');
  });

  it('filters out names in savedNames list', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A' },
      { name: '风雪夜', total: 75, level: 'B' },
    ]);
    const result = parseAiNames(json, '古风', ['云月星']);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('风雪夜');
  });

  it('filters out names violating compliance', () => {
    const json = JSON.stringify([
      { name: '云政府', total: 80, level: 'A' },
      { name: '云月星', total: 80, level: 'A' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('云月星');
  });

  it('clamps total between 0 and 100', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 150, level: 'A' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].total).toBe(100);
  });

  it('defaults invalid level to D', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'X' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].level).toBe('D');
  });

  it('uses AI usageRate when provided', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A', usageRate: 55, usageLevel: '中' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].usageRate).toBe(55);
    expect(result[0].usageLevel).toBe('中');
    expect(result[0].usageSource).toContain('AI');
  });

  it('falls back to local usage when AI usageRate is missing', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].usageSource).toContain('本地规则估算');
  });

  it('falls back to local usage for negative usageRate', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A', usageRate: -5 },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].usageSource).toContain('本地规则估算');
  });

  it('uses fallback detail from reason field', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A', reason: '古风意境好' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].detail).toBe('古风意境好');
  });

  it('returns empty array for non-array JSON', () => {
    const result = parseAiNames('{"name":"云月星"}', '古风');
    expect(result).toEqual([]);
  });

  it('throws on invalid JSON', () => {
    expect(() => parseAiNames('not json', '古风')).toThrow();
  });

  it('handles empty array', () => {
    const result = parseAiNames('[]', '古风');
    expect(result).toEqual([]);
  });

  it('defaults total to 0 for NaN values', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 'abc', level: 'A' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(result[0].total).toBe(0);
  });

  it('falls back to local usageLevel for invalid AI usageLevel', () => {
    const json = JSON.stringify([
      { name: '云月星', total: 80, level: 'A', usageRate: 50, usageLevel: 'invalid' },
    ]);
    const result = parseAiNames(json, '古风');
    expect(['高', '中', '低']).toContain(result[0].usageLevel);
  });
});
