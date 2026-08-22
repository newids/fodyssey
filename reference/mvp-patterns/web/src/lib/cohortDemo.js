// 기관 리포트 미리보기용 합성 코호트 (전략 v1.3 §⑨ D5-M7)
//
// 여기서 만드는 값은 전부 합성(시뮬레이션) 데이터다. 이 모듈은 실사용자 이력(history)을
// 인자로 받지 않으며, 어떤 화면도 실제 기록과 이 데이터를 합치지 않는다 — 코드상 분리가 곧 안전장치다.
// 화면에는 `예시 데이터(합성)` 배지를 항상 함께 노출한다.

import { LURE_TYPES, MIN_COHORT_SIZE, aggregateCohort } from './vulnerability.js';

export const SYNTHETIC_BADGE = '예시 데이터(합성)';

export const SYNTHETIC_COHORT = {
  name: 'OO구 디지털 교육센터 A반',
  period: '1회차 → 4회차',
  note: '실제 도입 기관 데이터가 아니라 화면 구조를 보이기 위한 합성 값입니다.',
};

// 유형별 1회차 평균 수준과 회차별 개선 폭의 시뮬레이션 파라미터.
// 친밀 유형은 참여자가 적어 표본 미달 행이 어떻게 보이는지 보여 준다.
const PROFILE_BY_LURE = {
  권위: { first: 62, gain: 21, panel: 34 },
  공포: { first: 55, gain: 17, panel: 34 },
  이득: { first: 48, gain: 12, panel: 32 },
  긴급: { first: 44, gain: 9, panel: 31 },
  친밀: { first: 51, gain: 14, panel: 18 }, // 최소 표본 미달 → 미산출
};

const COHORT_SIZE = 34;

function seededRng(seed = 20260817) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const clamp = (value) => Math.min(100, Math.max(0, Math.round(value * 10) / 10));

/**
 * 합성 코호트 구성원 목록. 각 구성원은 1회차·최신 회차의 유형별 취약도를 갖는다.
 * 패널에서 빠진 구성원은 최신 회차 값이 없다(= 그 회차에 참여하지 않음).
 */
export function syntheticMembers(size = COHORT_SIZE, rng = seededRng()) {
  return Array.from({ length: size }, (_, i) => {
    const first = {};
    const latest = {};
    for (const lure of LURE_TYPES) {
      const { first: base, gain, panel } = PROFILE_BY_LURE[lure];
      const spread = (rng() - 0.5) * 30;
      const firstScore = clamp(base + spread);
      first[lure] = firstScore;
      latest[lure] = i < panel ? clamp(firstScore - gain * (0.6 + rng() * 0.8)) : null;
    }
    return { id: `synthetic-${i + 1}`, first, latest };
  });
}

/**
 * 기관 리포트 미리보기 데이터. 집계는 실데이터 경로와 같은 함수(aggregateCohort)를 쓴다.
 * @returns {{badge: string, cohort: typeof SYNTHETIC_COHORT, size: number, minSample: number, rows: Array}}
 */
export function buildCohortReport() {
  const members = syntheticMembers();
  return {
    badge: SYNTHETIC_BADGE,
    cohort: SYNTHETIC_COHORT,
    size: members.length,
    minSample: MIN_COHORT_SIZE,
    rows: LURE_TYPES.map((lure) => aggregateCohort(members, lure)),
  };
}
