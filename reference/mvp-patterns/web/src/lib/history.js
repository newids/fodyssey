// 회차 이력 — 사전/사후 델타(1회차 대비 개선폭)의 실물 구현
// 저장 매체는 localStorage 뿐이고(→ storage.js), 이 모듈은 순수 계산만 맡는다.

import { LURE_TYPES, vulnerabilityIndex } from './vulnerability.js';

const round1 = (value) => Math.round(value * 10) / 10;

/**
 * 회차 기록을 이력에 덧붙인다(원본 불변).
 * @param {Array} history 기존 이력
 * @param {{exposures: Array, rulesViewed: boolean, score: number, total: number}} session
 * @returns {Array} 새 이력
 */
export function appendSession(history = [], session) {
  const record = {
    round: history.length + 1,
    at: new Date().toISOString(),
    rulesViewed: Boolean(session.rulesViewed),
    score: session.score ?? 0,
    total: session.total ?? 0,
    exposures: session.exposures ?? [],
  };
  return [...history, record];
}

export function latestSession(history = []) {
  return history.length ? history[history.length - 1] : null;
}

/** 전 회차의 노출을 회차 번호와 함께 펼친다. */
export function allExposures(history = []) {
  return history.flatMap((record) =>
    record.exposures.map((exposure) => ({ ...exposure, round: record.round })),
  );
}

/** 누적 취약도 지수 — 최근 회차 가중이 적용된 현재 값. */
export function overallIndex(history = []) {
  return vulnerabilityIndex(allExposures(history));
}

function sessionIndex(record) {
  if (!record) return null;
  return vulnerabilityIndex(
    record.exposures.map((exposure) => ({ ...exposure, round: record.round })),
    { currentRound: record.round },
  );
}

/**
 * 자극 유형별 1회차 대비 개선폭. 1회차와 최신 회차 모두에서 산출된 유형만 값을 낸다
 * (전략의 패널 고정 원칙을 개인 단위에 적용한 형태).
 * @param {Array} history
 * @returns {Record<string, {status: 'measured'|'pending', first: number|null, latest: number|null, delta: number|null}>}
 */
export function improvementByLure(history = []) {
  const pending = { status: 'pending', first: null, latest: null, delta: null };
  if (history.length < 2) {
    return Object.fromEntries(LURE_TYPES.map((lure) => [lure, { ...pending }]));
  }

  const firstIndex = sessionIndex(history[0]);
  const lastIndex = sessionIndex(latestSession(history));

  return Object.fromEntries(
    LURE_TYPES.map((lure) => {
      const first = firstIndex[lure];
      const latest = lastIndex[lure];
      if (first.status !== 'measured' || latest.status !== 'measured') {
        return [lure, { ...pending }];
      }
      return [
        lure,
        {
          status: 'measured',
          first: first.score,
          latest: latest.score,
          delta: round1(first.score - latest.score), // 양수면 개선
        },
      ];
    }),
  );
}

/** 결과 화면 안내용 요약. */
export function historySummary(history = []) {
  const latest = latestSession(history);
  return {
    rounds: history.length,
    rulesViewed: Boolean(latest?.rulesViewed),
    score: latest?.score ?? 0,
    total: latest?.total ?? 0,
  };
}
