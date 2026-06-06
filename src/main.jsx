import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpenCheck, Download, Heart, History, RefreshCw, Search, ShieldX, Sparkles, Star, Trash2, Undo2 } from 'lucide-react';
import './styles.css';

import { AI_PRESETS, COMPLIANCE_RULES, DEFAULT_AI_CONFIG, LEVEL_OPTIONS, MODE_OPTIONS, VIEW_OPTIONS } from './utils/constants.js';
import { loadStore, saveStore } from './utils/storage.js';
import { generateNicknames, getSavedNames, normalizeRejectedItem, getRejectedNames, recordSession } from './utils/nickname.js';
import { buildAiPrompt, parseAiNames } from './utils/ai.js';
import TabBar from './components/TabBar.jsx';
import NicknameFormFields from './components/NicknameFormFields.jsx';

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
  const rejectedItems = rejected.map(normalizeRejectedItem);
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
    saveStore(nextStore);
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
    persist({ ...store, sessions: recordSession(store, form, nextNames.length) });
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
      const nextNames = parseAiNames(content, form.style, getSavedNames(rejected, favorites)).slice(0, Math.min(Number(form.count) || 20, 80));
      persist({ ...store, aiConfig, sessions: recordSession(store, form, nextNames.length, 'AI生成') });
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
    const content = JSON.stringify({ favorites, rejected, sessions: store.sessions || [] }, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '昵称筛选结果.json';
    link.click();
    URL.revokeObjectURL(url);
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
        <TabBar options={MODE_OPTIONS} value={generateMode} onChange={switchGenerateMode} />
      </section>

      {generateMode === '本地生成' ? (
        <section className="panel controls">
          <NicknameFormFields form={form} updateForm={updateForm} />
          <button className="primary" onClick={handleGenerate}><RefreshCw size={18} /> 生成并评分</button>
        </section>
      ) : (
        <section className="panel ai-panel">
          <div>
            <h2><Sparkles size={20} /> AI 生成配置</h2>
            <p>支持 OpenAI 兼容接口与 DeepSeek，根据新的 `评判标准.md` 生成候选昵称。API Key 仅保存在当前浏览器本地。</p>
          </div>
          <NicknameFormFields form={form} updateForm={updateForm} />
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
        <TabBar options={VIEW_OPTIONS} value={activeView} onChange={setActiveView} />
      </section>

      <section className="panel filterbar">
        <div className="search"><Search size={18} /><input placeholder="按包含文字筛选" value={keyword} onChange={(event) => setKeyword(event.target.value)} /></div>
        <TabBar options={LEVEL_OPTIONS} value={levelFilter} onChange={setLevelFilter} className="chip" />
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
            {favorites.length === 0 ? <p className="empty">点击"喜欢"后会保存到这里。</p> : favorites.map((item) => <div className="mini" key={item.name}><b>{item.name}</b><span>{item.level} · {item.total}</span></div>)}
          </div>
          <div className="panel">
            <h2><ShieldX size={20} /> 排除列表</h2>
            {rejectedItems.length === 0 ? <p className="empty">点击"排除"后会保存到这里。</p> : rejectedItems.slice(0, 12).map((item) => <div className="mini" key={item.name}><b>{item.name}</b><span>{item.level} · {item.total}</span></div>)}
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

createRoot(document.getElementById('root')).render(<App />);
