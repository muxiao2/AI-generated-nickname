import { STORAGE_KEY } from './constants.js';

const EMPTY_STORE = { favorites: [], rejected: [], sessions: [] };

export function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { ...EMPTY_STORE };
  } catch (error) {
    console.warn('读取本地存储失败，已使用空数据。', error);
    return { ...EMPTY_STORE };
  }
}

export function saveStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
