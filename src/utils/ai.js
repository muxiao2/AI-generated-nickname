import { AI_CRITERIA_PROMPT } from './constants.js';
import { isCjkOnly, violatesCompliance } from './chinese.js';
import { getSavedNames, estimateUsage } from './nickname.js';

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
    .filter((item) => item && isCjkOnly(item.name || '') && !savedNames.includes(item.name) && !violatesCompliance(item.name))
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
