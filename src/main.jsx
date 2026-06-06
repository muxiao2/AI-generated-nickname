import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpenCheck, Download, Heart, History, RefreshCw, Search, ShieldX, Sparkles, Star, Trash2, Undo2 } from 'lucide-react';
import './styles.css';

const ELEGANT_CHARS = '云月星雪雨风清浅澜溪岚烟竹松梅兰荷露霜雾棠栀芷瑾瑜宁安然念初晚秋春夏冬南北西东遥知予书墨青白素锦绾辞梦眠听拾鹿鹤鲸鸢萤梨桃杏茶酒弦歌舟川岛屿森沐禾苏若言微尘光影洛汀汐沫澈宛栖棱檀';
const CUTE_CHARS = '小软甜糯糖桃梨栗橘柚奶兔喵鹿芽豆团圆星泡啾眠暖晴夏果可乐安朵铃米咕嘟乖喜萌绵花露云月';
const COOL_CHARS = '夜川澈凛寒烬曜珩砚墨玄青屿岚弦渡野序辞尘霁曜临舟隼衡燃寂棠钧辰朔';
const NEGATIVE_WORDS = ['丑', '笨', '蠢', '傻', '死', '病', '贱', '滚', '烂', '臭', '毒', '赌', '黄', '黑产', '诈骗'];
const MEME_WORDS = ['杀马特', '非主流', '霸总', 'emo', 'yyds', '绝绝子'];
const COMMON_USAGE_CHARS = '小月星云清安宁雨风雪白青甜软梦初晚夏秋春桃梨茶墨川鹿森然';
const PROHIBITED_TERMS = ['国家', '政府', '中央', '网信', '公安', '法院', '检察', '军委', '军队', '警察', '政党', '机关', '新闻', '媒体', '邪教', '迷信', '谣言', '暴力', '恐怖', '犯罪', '赌博', '色情', '淫秽', '民族仇恨', '民族歧视', '颠覆', '分裂', '泄密', '国旗', '国徽', '红十字'];
const COMPLIANCE_RULES = [
  '不得违反宪法、法律法规，不得危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一。',
  '不得损害国家荣誉、公共利益或他人合法权益。',
  '不得煽动民族仇恨、民族歧视，破坏民族团结。',
  '不得破坏国家宗教政策，不得宣扬邪教或封建迷信。',
  '不得散布谣言、扰乱社会秩序、破坏社会稳定。',
  '不得散布淫秽、色情、赌博、暴力、恐怖或教唆犯罪内容。',
  '不得侮辱、诽谤他人，不得包含法律、行政法规禁止的其他内容。',
  '不得假冒、仿冒或捏造政党、政府机关、企事业单位、社会组织、新闻媒体、国家或国际组织名称、标识。'
];
const STORAGE_KEY = 'hanzi-nickname-studio-v1';
const AI_PRESETS = {
  OpenAI: { endpoint: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  DeepSeek: { endpoint: 'https://api.deepseek.com/chat/completions', model: 'deepseek-chat' },
};
const DEFAULT_AI_CONFIG = { provider: 'DeepSeek', ...AI_PRESETS.DeepSeek, apiKey: '' };
const AI_CRITERIA_PROMPT = `总分100分。读音韵律30分：音节长度8分、声调节奏8分、谐音与歧义14分。视觉排版25分：汉字字形10分、符号字母搭配10分、整体观感5分。意境风格30分：风格统一性10分、内涵与画面感12分、词汇质感8分。场景适配与实用性15分：易记性8分、通用适配性7分。通用扣分：包含低俗、违规、敏感字词总分置0；叠字泛滥或非主流网络用语扣10分；文字、字母、符号强行拼接扣8分。评级：S为90-100，A为80-89，B为70-79，C为60-69，D为0-59。`;
const FULL_CHINESE_CHARS = Array.from({ length: 0x9fff - 0x4e00 + 1 }, (_, index) => String.fromCharCode(0x4e00 + index)).join('');

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { favorites: [], rejected: [], sessions: [] };
  } catch (error) {
    console.warn('读取本地存储失败，已使用空数据。', error);
    return { favorites: [], rejected: [], sessions: [] };
  }
}

function saveStore(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('保存本地存储失败（可能空间不足或被浏览器禁用）。', error);
    return false;
  }
}

function uniqueText(text) {
  return Array.from(new Set(Array.from(text).filter((item) => /[\u4e00-\u9fff]/.test(item)))).join('');
}

function getLibrary(style) {
  if (style === '可爱') return uniqueText(CUTE_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '清冷') return uniqueText(COOL_CHARS + ELEGANT_CHARS + FULL_CHINESE_CHARS);
  if (style === '古风') return uniqueText(ELEGANT_CHARS + COOL_CHARS + CUTE_CHARS + FULL_CHINESE_CHARS);
  return uniqueText(ELEGANT_CHARS + CUTE_CHARS + COOL_CHARS + FULL_CHINESE_CHARS);
}

function getRejectedNames(rejected) {
  return rejected.map((item) => (typeof item === 'string' ? item : item.name)).filter(Boolean);
}

function getSavedNames(rejected, favorites = []) {
  return [...new Set([...getRejectedNames(rejected), ...favorites.map((item) => item.name).filter(Boolean)])];
}

function getToneType(char) {
  const level = '妈麻花家云风清初书知春东南西苏栀安宁星青听舟川汐霜秋';
  const oblique = '月雪雨浅澜岚晚梦鹿鹤墨锦念沐洛棠瑾瑜若夜凛烬渡野序';
  if (level.includes(char)) return '平';
  if (oblique.includes(char)) return '仄';
  return char.charCodeAt(0) % 2 === 0 ? '平' : '仄';
}

function violatesCompliance(name) {
  return PROHIBITED_TERMS.some((word) => name.includes(word));
}

function estimateUsage(name, style) {
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

function scoreNickname(name, requiredChar, style) {
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

function generateNicknames({ requiredChar, length, count, style, placement }, rejected, favorites = []) {
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

function buildAiPrompt({ requiredChar, length, count, style, placement }, rejected, favorites = []) {
  return `你是中文昵称生成与评估助手。请严格根据以下评判标准生成昵称：${AI_CRITERIA_PROMPT}
生成要求：
1. 只返回纯汉字昵称，不要包含字母、数字、符号、表情。
2. 每个昵称必须包含指定汉字“${requiredChar}”。
3. 昵称长度必须是${length}个汉字。
4. 风格为“${style}”，指定汉字位置为“${placement}”。
5. 不得出现低俗、违规、敏感、仿冒机构或法律法规禁止内容。
6. 避开这些已排除或已喜欢昵称：${getSavedNames(rejected, favorites).slice(0, 200).join('、') || '无'}。
7. 生成${Math.min(Number(count) || 20, 80)}个候选。
8. 请根据你的通用语料认知、常见昵称构成、公开网络常见度经验，为每个昵称估算使用率百分比和高/中/低等级；这是 AI 估算，不代表真实全网注册数量。
返回格式必须是 JSON 数组，不要输出 Markdown。每项格式：
{"name":"昵称","total":88,"level":"A","detail":"读音xx/30，视觉xx/25，意境xx/30，实用xx/15。","reason":"简短说明","usageRate":42,"usageLevel":"中","usageSource":"AI基于通用语料认知和常见昵称模式估算"}`;
}

function parseAiNames(text, style, savedNames = []) {
  const cleanText = text.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleanText);
  } catch (error) {
    console.warn('AI 返回内容不是有效 JSON，无法解析。', error);
    return [];
  }
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

function App() {
  const [form, setForm] = useState({ requiredChar: '月', length: 3, count: 120, style: '古风', placement: '任意' });
  const [store, setStore] = useState(loadStore);
  const [names, setNames] = useState([]);
  const [levelFilter, setLevelFilter] = useState('全部');
  const [keyword, setKeyword] = useState('');
  const [activeView, setActiveView] = useState('候选');
  const [theme, setTheme] = useState(store.theme || 'light');
  const [showCriteria, setShowCriteria] = useState(false);
  const [aiConfig, setAiConfig] = useState(store.aiConfig || DEFAULT_AI_CONFIG);
  const [aiStatus, setAiStatus] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [generateMode, setGenerateMode] = useState(store.generateMode || '本地生成');
  const favorites = store.favorites || [];
  const rejected = store.rejected || [];
  const rejectedItems = rejected.map((item) => (typeof item === 'string' ? { name: item, total: 0, level: 'D', detail: '历史排除记录。' } : item));
  const currentList = activeView === '喜欢' ? favorites : activeView === '排除' ? rejectedItems : names;

  const filteredNames = useMemo(() => currentList.filter((item) => {
    const levelMatched = levelFilter === '全部' || item.level === levelFilter;
    const keywordMatched = !keyword || item.name.includes(keyword);
    return levelMatched && keywordMatched;
  }), [currentList, levelFilter, keyword]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function persist(nextStore) {
    setStore(nextStore);
    if (!saveStore(nextStore)) {
      console.warn('数据已在内存中更新，但未能写入本地存储。下次刷新页面数据可能丢失。');
    }
  }

  function switchTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    persist({ ...store, theme: nextTheme });
  }

  function updateAiConfig(key, value) {
    const nextConfig = { ...aiConfig, [key]: value };
    setAiConfig(nextConfig);
    persist({ ...store, aiConfig: nextConfig });
  }

  function switchAiProvider(provider) {
    const nextConfig = { ...aiConfig, provider, ...AI_PRESETS[provider] };
    setAiConfig(nextConfig);
    persist({ ...store, aiConfig: nextConfig });
  }

  function switchGenerateMode(mode) {
    setGenerateMode(mode);
    persist({ ...store, generateMode: mode });
  }

  function handleGenerate() {
    const nextNames = generateNicknames(form, rejected, favorites);
    const session = { time: new Date().toLocaleString('zh-CN'), form, total: nextNames.length };
    persist({ ...store, sessions: [session, ...(store.sessions || [])].slice(0, 20) });
    setNames(nextNames);
    console.info(`已生成 ${nextNames.length} 个昵称，已自动排除 ${rejected.length} 个不再生成项。`);
  }

  async function handleAiGenerate() {
    if (!aiConfig.endpoint || !aiConfig.model || !aiConfig.apiKey) {
      setAiStatus('请先填写 AI API 地址、模型名和 API Key。');
      return;
    }
    setIsAiLoading(true);
    setAiStatus('AI 正在根据新评判标准生成昵称。');
    try {
      const response = await fetch(aiConfig.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.apiKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: '你只输出 JSON，不输出 Markdown，不解释过程。' },
            { role: 'user', content: buildAiPrompt(form, rejected, favorites) },
          ],
          temperature: 0.8,
        }),
      });
      if (!response.ok) throw new Error(`AI 接口请求失败：${response.status}`);
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        setAiStatus('AI 返回内容为空，请检查模型名和 API 配置。');
        return;
      }
      const nextNames = parseAiNames(content, form.style, getSavedNames(rejected, favorites)).slice(0, Math.min(Number(form.count) || 20, 80));
      if (nextNames.length === 0) {
        setAiStatus('AI 返回的内容无法解析为有效昵称，请重试或检查模型配置。');
        return;
      }
      const session = { time: new Date().toLocaleString('zh-CN'), form: { ...form, source: 'AI生成' }, total: nextNames.length };
      persist({ ...store, aiConfig, sessions: [session, ...(store.sessions || [])].slice(0, 20) });
      setNames(nextNames);
      setActiveView('候选');
      setAiStatus(`AI 已生成 ${nextNames.length} 个昵称。`);
      console.info(`AI 已根据新评判标准生成 ${nextNames.length} 个昵称。`);
    } catch (error) {
      setAiStatus(`AI 生成失败：${error.message}`);
      console.warn('AI 生成失败。', error);
    } finally {
      setIsAiLoading(false);
    }
  }

  function addFavorite(item) {
    if (favorites.some((fav) => fav.name === item.name)) return;
    persist({ ...store, favorites: [{ ...item, savedAt: new Date().toLocaleString('zh-CN') }, ...favorites] });
    setNames((current) => current.filter((row) => row.name !== item.name));
  }

  function rejectName(item) {
    const nextRejected = getRejectedNames(rejected).includes(item.name) ? rejected : [{ ...item, rejectedAt: new Date().toLocaleString('zh-CN') }, ...rejected];
    persist({ ...store, rejected: nextRejected, favorites: favorites.filter((fav) => fav.name !== item.name) });
    setNames((current) => current.filter((row) => row.name !== item.name));
  }

  function removeFavorite(name) {
    persist({ ...store, favorites: favorites.filter((item) => item.name !== name) });
  }

  function removeRejected(name) {
    persist({ ...store, rejected: rejected.filter((item) => (typeof item === 'string' ? item : item.name) !== name) });
  }

  function exportData() {
    let url;
    try {
      const content = JSON.stringify({ favorites, rejected, sessions: store.sessions || [] }, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '昵称筛选结果.json';
      link.click();
    } catch (error) {
      console.error('导出数据失败。', error);
      alert('导出失败，请重试。');
    } finally {
      if (url) URL.revokeObjectURL(url);
    }
  }

  return (
    <main className={`page theme-${theme}`}>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <p className="eyebrow"><Sparkles size={16} /> 汉字昵称生成评选器</p>
            <button className="criteria-trigger" onClick={() => setShowCriteria((current) => !current)} aria-expanded={showCriteria}>
              <BookOpenCheck size={18} /> 评分标准
            </button>
          </div>
          <h1><span>围绕一个汉字</span>生成昵称库</h1>
          <p className="hero-desc">只输出纯汉字昵称，自动计算 100 分评分与 S-D 评级；适合多轮筛选、人工成组收藏，并自动避开已排除结果。</p>
          {showCriteria && (
            <div className="criteria-card">
              <section className="criteria-section">
                <h2>评估标准</h2>
                <div className="criteria-metrics">
                  <span><b>读音韵律</b><em>30 分</em></span>
                  <span><b>视觉排版</b><em>25 分</em></span>
                  <span><b>意境风格</b><em>30 分</em></span>
                  <span><b>场景适配</b><em>15 分</em></span>
                </div>
                <div className="criteria-note">
                  <b>使用率估算</b>
                  <p>基于常见汉字、风格字频、昵称长度和重复结构计算，不代表全网真实注册数量。</p>
                </div>
              </section>
              <section className="criteria-section">
                <h2>生成规则</h2>
                <div className="rule-list">
                  <span>仅生成纯汉字昵称</span>
                  <span>必须包含指定汉字</span>
                  <span>自动跳过已排除昵称</span>
                  <span>过滤低俗、违规、仿冒和法律法规禁止的风险内容</span>
                </div>
                <ol className="compliance-list">
                  {COMPLIANCE_RULES.map((rule) => <li key={rule}>{rule}</li>)}
                </ol>
              </section>
            </div>
          )}
        </div>
        <div className="hero-actions">
          <button className="ghost" onClick={switchTheme}>{theme === 'dark' ? '切换白底风格' : '切换深色风格'}</button>
          <button className="ghost" onClick={exportData}><Download size={18} /> 导出本地结果</button>
        </div>
      </section>

      <section className="panel modebar">
        {['本地生成', 'AI生成'].map((mode) => <button key={mode} className={generateMode === mode ? 'tab active' : 'tab'} onClick={() => switchGenerateMode(mode)}>{mode}</button>)}
      </section>

      {generateMode === '本地生成' ? (
        <section className="panel controls">
          <label>指定汉字<input value={form.requiredChar} maxLength={2} onChange={(event) => updateForm('requiredChar', event.target.value)} /></label>
          <label>昵称字数<input type="number" min="2" max="6" value={form.length} onChange={(event) => updateForm('length', Number(event.target.value))} /></label>
          <label>生成数量<input type="number" min="20" max="5000" value={form.count} onChange={(event) => updateForm('count', Number(event.target.value))} /></label>
          <label>风格<select value={form.style} onChange={(event) => updateForm('style', event.target.value)}><option>古风</option><option>清冷</option><option>可爱</option><option>综合</option></select></label>
          <label>汉字位置<select value={form.placement} onChange={(event) => updateForm('placement', event.target.value)}><option>任意</option><option>开头</option><option>结尾</option></select></label>
          <button className="primary" onClick={handleGenerate}><RefreshCw size={18} /> 生成并评分</button>
        </section>
      ) : (
        <section className="panel ai-panel">
          <div>
            <h2><Sparkles size={20} /> AI 生成配置</h2>
            <p>支持 OpenAI 兼容接口与 DeepSeek，根据新的 `评判标准.md` 生成候选昵称。API Key 仅保存在当前浏览器本地。</p>
          </div>
          <label>指定汉字<input value={form.requiredChar} maxLength={2} onChange={(event) => updateForm('requiredChar', event.target.value)} /></label>
          <label>昵称字数<input type="number" min="2" max="6" value={form.length} onChange={(event) => updateForm('length', Number(event.target.value))} /></label>
          <label>生成数量<input type="number" min="20" max="5000" value={form.count} onChange={(event) => updateForm('count', Number(event.target.value))} /></label>
          <label>风格<select value={form.style} onChange={(event) => updateForm('style', event.target.value)}><option>古风</option><option>清冷</option><option>可爱</option><option>综合</option></select></label>
          <label>汉字位置<select value={form.placement} onChange={(event) => updateForm('placement', event.target.value)}><option>任意</option><option>开头</option><option>结尾</option></select></label>
          <label>AI 服务<select value={aiConfig.provider || 'DeepSeek'} onChange={(event) => switchAiProvider(event.target.value)}><option>DeepSeek</option><option>OpenAI</option></select></label>
          <label>API 地址<input value={aiConfig.endpoint} onChange={(event) => updateAiConfig('endpoint', event.target.value)} /></label>
          <label>模型名<input value={aiConfig.model} onChange={(event) => updateAiConfig('model', event.target.value)} /></label>
          <label>API Key<input type="password" value={aiConfig.apiKey} onChange={(event) => updateAiConfig('apiKey', event.target.value)} /></label>
          <button className="primary" onClick={handleAiGenerate} disabled={isAiLoading}><Sparkles size={18} /> {isAiLoading ? 'AI 生成中' : 'AI 生成'}</button>
          {aiStatus && <p className="ai-status">{aiStatus}</p>}
        </section>
      )}

      <section className="stats">
        <div><strong>{names.length}</strong><span>本轮候选</span></div>
        <div><strong>{favorites.length}</strong><span>已收藏成组</span></div>
        <div><strong>{rejectedItems.length}</strong><span>已排除不再生成</span></div>
      </section>

      <section className="panel viewbar">
        {['候选', '喜欢', '排除'].map((view) => <button key={view} className={activeView === view ? 'tab active' : 'tab'} onClick={() => setActiveView(view)}>{view}</button>)}
      </section>

      <section className="panel filterbar">
        <div className="search"><Search size={18} /><input placeholder="按包含文字筛选" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></div>
        {['全部', 'S', 'A', 'B', 'C', 'D'].map((level) => <button key={level} className={levelFilter === level ? 'chip active' : 'chip'} onClick={() => setLevelFilter(level)}>{level}</button>)}
      </section>

      <section className="grid">
        <div className="panel list">
          <h2><Star size={20} /> {activeView}昵称</h2>
          <div className="list-scroll">
            {filteredNames.length === 0 ? <p className="empty">暂无候选，请先生成或调整筛选条件。</p> : filteredNames.map((item) => (
              <article className="card" key={item.name}>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.detail}</p>
                  <p className="usage-source">{item.usageSource || '使用率数据来源：本地规则估算。'}</p>
                </div>
                <span className={`badge level-${item.level}`}>{item.level} · {item.total}</span>
                <span className={`usage usage-${item.usageLevel || '低'}`}>使用率{item.usageLevel || '低'} · {item.usageRate || 0}%</span>
                {activeView === '喜欢' ? <button onClick={() => removeFavorite(item.name)}><Undo2 size={16} /> 取消喜欢</button> : <button onClick={() => addFavorite(item)}><Heart size={16} /> 喜欢</button>}
                {activeView === '排除' ? <button onClick={() => removeRejected(item.name)}><Undo2 size={16} /> 取消排除</button> : <button className="danger" onClick={() => rejectName(item)}><ShieldX size={16} /> 排除</button>}
              </article>
            ))}
          </div>
        </div>

        <aside className="side">
          <div className="panel">
            <h2><Heart size={20} /> 喜欢的一批</h2>
            {favorites.length === 0 ? <p className="empty">点击“喜欢”后会保存到这里。</p> : favorites.map((item) => <div className="mini" key={item.name}><b>{item.name}</b><span>{item.level} · {item.total}</span></div>)}
          </div>
          <div className="panel">
            <h2><ShieldX size={20} /> 排除列表</h2>
            {rejectedItems.length === 0 ? <p className="empty">点击“排除”后会保存到这里。</p> : rejectedItems.slice(0, 12).map((item) => <div className="mini" key={item.name}><b>{item.name}</b><span>{item.level} · {item.total}</span></div>)}
          </div>
          <div className="panel">
            <h2><History size={20} /> 筛选记录</h2>
            {(store.sessions || []).length === 0 ? <p className="empty">暂无生成记录。</p> : store.sessions.map((session, index) => <div className="mini" key={`${session.time}-${index}`}><b>{session.form.requiredChar} · {session.form.length}字 · {session.form.style}</b><span>{session.time}，{session.total} 个</span></div>)}
          </div>
          <button className="danger wide" onClick={() => persist({ favorites: [], rejected: [], sessions: [] })}><Trash2 size={18} /> 清空本地数据</button>
        </aside>
      </section>
    </main>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('找不到 #root 元素，请检查 index.html 是否包含 <div id="root"></div>。');
}
createRoot(rootElement).render(<App />);
