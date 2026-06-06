import React from 'react';
import { STYLE_OPTIONS, PLACEMENT_OPTIONS } from '../utils/constants.js';

export default function NicknameFormFields({ form, updateForm }) {
  return (
    <>
      <label>指定汉字<input value={form.requiredChar} maxLength={2} onChange={(event) => updateForm('requiredChar', event.target.value)} /></label>
      <label>昵称字数<input type="number" min="2" max="6" value={form.length} onChange={(event) => updateForm('length', Number(event.target.value))} /></label>
      <label>生成数量<input type="number" min="20" max="5000" value={form.count} onChange={(event) => updateForm('count', Number(event.target.value))} /></label>
      <label>风格<select value={form.style} onChange={(event) => updateForm('style', event.target.value)}>{STYLE_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
      <label>汉字位置<select value={form.placement} onChange={(event) => updateForm('placement', event.target.value)}>{PLACEMENT_OPTIONS.map((p) => <option key={p}>{p}</option>)}</select></label>
    </>
  );
}
