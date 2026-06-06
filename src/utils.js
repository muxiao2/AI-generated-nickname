export const ELEGANT_CHARS = '云月星雪雨风清浅澜溪岚烟竹松梅兰荷露霜雾棠栀芷瑾瑜宁安然念初晚秋春夏冬南北西东遥知予书墨青白素锦绾辞梦眠听拾鹿鹤鲸鸢萤梨桃杏茶酒弦歌舟川岛屿森沐禾苏若言微尘光影洛汀汐沫澈宛栖棱檀';
export const CUTE_CHARS = '小软甜糯糖桃梨栗橘柚奶兔喵鹿芽豆团圆星泡啾眠暖晴夏果可乐安朵铃米咕嘟乖喜萌绵花露云月';
export const COOL_CHARS = '夜川澈凛寒烬曜珩砚墨玄青屿岚弦渡野序辞尘霁曜临舟隼衡燃寂棠钧辰朔';
export const NEGATIVE_WORDS = ['丑', '笨', '蠢', '傻', '死', '病', '贱', '滚', '烂', '臭', '毒', '赌', '黄', '黑产', '诈骗'];
export const MEME_WORDS = ['杀马特', '非主流', '霸总', 'emo', 'yyds', '绝绝子'];
export const COMMON_USAGE_CHARS = '小月星云清安宁雨风雪白青甜软梦初晚夏秋春桃梨茶墨川鹿森然';
export const PROHIBITED_TERMS = ['国家', '政府', '中央', '网信', '公安', '法院', '检察', '军委', '军队', '警察', '政党', '机关', '新闻', '媒体', '邪教', '迷信', '谣言', '暴力', '恐怖', '犯罪', '赌博', '色情', '淫秽', '民族仇恨', '民族歧视', '颠覆', '分裂', '泄密', '国旗', '国徽', '红十字'];
export const COMPLIANCE_RULES = [
  '不得违反宪法、法律法规，不得危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一。',
  '不得损害国家荣誉、公共利益或他人合法权益。',
  '不得煽动民族仇恨、民族歧视，破坏民族团结。',
  '不得破坏国家宗教政策，不得宣扬邪教或封建迷信。',
  '不得散布谣言、扰乱社会秩序、破坏社会稳定。',
  '不得散布淫秽、色情、赌博、暴力、恐怖或教唆犯罪内容。',
  '不得侮辱、诽谤他人，不得包含法律、行政法规禁止的其他内容。',
  '不得假冒、仿冒或捏造政党、政府机关、企事业单位、社会组织、新闻媒体、国家或国际组织名称、标识。'
];
export const STORAGE_KEY = 'hanzi-nickname-studio-v1';
export const AI_PRESETS = {
  OpenAI: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  DeepSeek: { endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
};
export const DEFAULT_AI_CONFIG = { provider: 'DeepSeek', ...AI_PRESETS.DeepSeek, apiKey: '' };
export const AI_CRITERIA_PROMPT = `总分100分。读音韵律30分：音节长度8分、声调节奏8分、谐音与歧义14分。视觉排版25分：汉字字形10分、符号字母搭配10分、整体观感5分。意境风格30分：风格统一性10分、内涵与画面感12分、词汇质感8分。场景适配与实用性15分：易记性8分、通用适配性7分。通用扣分：包含低俗、违规、敏感字词总分置0；叠字泛滥或非主流网络用语扣10分；文字、字母、符号强行拼接扣8分。评级：S为90-100，A为80-89，B为70-79，C为60-69，D为0-59。`;
export const FULL_CHINESE_CHARS = Array.from({ length: 0x9fff - 0x4e00 + 1 }, (_, index) => String.fromCharCode(0x4e00 + index)).join('');

export function uniqueText(text) {
  return Array.from(new Set(Array.from(text).filter((item) => /[\u4e00-\u9fff]/.test(item)))).join('');
}

export function getLibrary(style) {
  if (style === '可爱') return uniqueText(CUTE_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '清冷') return uniqueText(COOL_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '古风') return uniqueText(ELEGANT_CHARS + COOL_CHARS + CUTE_CHARS + FULL_CHINESE_CHARS);
  return uniqueText(ELEGANT_CHARS + CUTE_CHARS + COOL_CHARS + FULL_CHINESE_CHARS);
}

export function getRejectedNames(rejected) {
  return rejected.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean);
}

export function getSavedNames(rejected, favorites = []) {
  return [...new Set([...getRejectedNames(rejected), ...favorites.map((item) => item.name).filter(Boolean)])];
}

export function getToneType(char) {
  const level = '妈麻花家云风清初书知春东南西苏栀安宁星青听舟川汐霜秋';
  const oblique = '月雪雨浅澜岚晚梦鹿鹤墨锦念沐洛棠瑾瑜若夜凛烬渡野序';
  if (level.includes(char)) return '平';
  if (oblique.includes(char)) return '仄';
  return char.charCodeAt(0) % 2 === 0 ? '平' : '仄';
}

export function violatesCompliance(name) {
  return PROHIBITED_TERMS.some((word) => name.includes(word));
}

export function estimateUsage(name, style) {
  const chars = Array.from(name);
  const styleChars = style === '可爱' ? CUTE_CHARS : style === '清冷' ? COOL_CHARS : ELEGANT_CHARS;
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
  const symbolScore = /^[\u4e00-\u9fa5]+$/.test(name) ? 10 : 0;
  const visualScore = uniqueCount === chars.length ? 5 : 2;
  const styleChars = style === '可爱' ? CUTE_CHARS : style === '清冷' ? COOL_CHARS : ELEGANT_CHARS;
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

export function makeName(requiredChar, length, pool, index, fixedIndex) {
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
  const cleanChar = Array.from(requiredChar).find((char) => /[\u4e00-\u9fff]/.test(char)) || '';
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
      if (/^[\u4e00-\u9fff]+$/.test(name) && !savedNames.includes(name) && !violatesCompliance(name)) {
        result.set(name, { name, ...scoreNickname(name, cleanChar, style) });
      }
    }
  }

  return Array.from(result.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

export function buildAiPrompt({ requiredChar, length, count, style, placement }, rejected, favorites = []) {
  return `你是中文昵称生成与评估助手。请严格根据以下评判标准生成昵称：${AI_CRITERIA_PROMPT}
生成要求：
1. 只返回纯汉字昵称，不要包含字母、数字、符号、表情。
2. 每个昵称必须包含指定汉字"${requiredChar}"。
3. 昵称长度必须是${length}个汉字。
4. 风格为"${style}"，指定汉字位置为"${placement}"。
5. 不得出现低俗、违规、敏感、仿冒机构或法律法规禁止内容。
6. 避开这些已排除或已喜欢昵称：${getSavedNames(rejected, favorites).slice(0, 200).join('、') || '无'}。
7. 生成${Math.min(Number(count) || 20, 80)}个候选。
8. 请根据你的通用语料认知、常见昵称构成、公开网络常见度经验，为每个昵称估算使用率百分比和高/中/低等级；这是 AI 估算，不代表真实全网注册数量。
返回格式必须是 JSON 数组，不要输出 Markdown。每项格式：
{"name":"昵称","total":88,"level":"A","detail":"读音xx/30，视觉xx/25，意境xx/30，实用xx/15。","reason":"简短说明","usageRate":42,"usageLevel":"中","usageSource":"AI基于通用语料认知和常见昵称模式估算"}`;
}

export function parseAiNames(text, style, savedNames = []) {
  const cleanText = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleanText);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .filter((item) => item && /^[\u4e00-\u9fff]+$/.test(item.name || '') && !savedNames.includes(item.name) && !violatesCompliance(item.name))
    .map((item) => {
      const localUsage = estimateUsage(item.name, style);
      const aiUsageRate = Number(item.usageRate);
      const hasAiUsage = Number.isFinite(aiUsageRate) && aiUsageRate >= 0;
      const usageRate = hasAiUsage ? Math.max(0, Math.min(100, aiUsageRate)) : localUsage.usageRate;
      const usageLevel = ['高', '中', '低'].includes(item.usageLevel) ? item.usageLevel : localUsage.usageLevel;
      return {
        name: item.name,
        total: Math.max(0, Math.min(100, Number(item.total) || 0)),
        level: ['S', 'A', 'B', 'C', 'D'].includes(item.level) ? item.level : 'D',
        detail: item.detail || item.reason || 'AI 根据评判标准生成并评估。',
        usageRate,
        usageLevel,
        usageSource: hasAiUsage ? (item.usageSource || 'AI 基于通用语料认知和常见昵称模式估算，不代表真实全网注册数量。') : localUsage.usageSource,
      };
    });
}
