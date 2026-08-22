// localStorage 접근부 — 서버·네트워크 전송 없음. 기기 밖으로 나가는 데이터가 없다.
// 저장 실패(사생활 보호 모드 등)해도 세션 진행에는 지장이 없도록 전부 폴백을 둔다.

export const PROFILE_KEY = 'codyssey-profile-v1';
export const HISTORY_KEY = 'codyssey-history-v1';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // 삭제 실패해도 화면 상태는 이미 초기화된다
  }
}

export const loadProfile = () => read(PROFILE_KEY, null);
export const saveProfile = (profile) => write(PROFILE_KEY, profile);

export const loadHistory = () => {
  const value = read(HISTORY_KEY, []);
  return Array.isArray(value) ? value : [];
};
export const saveHistory = (history) => write(HISTORY_KEY, history);

export function clearAll() {
  remove(PROFILE_KEY);
  remove(HISTORY_KEY);
}
