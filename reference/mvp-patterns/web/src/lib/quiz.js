// 훈련 세션 구성 — 진단(1회차) → 취약 유형 집중 노출(2회차부터)
// 전략 v1.3 §3-4′ 훈련 루프의 ②③단계를 판별 퀴즈형으로 축약 구현한다.
//
// 한 세션 = 3라운드 × 문자 3건 = 사기 6건 + 정상 3건.
// 사기 6건은 자극 유형 2종에 3건씩 배정한다 — 유형별 누적 노출이 3건(최소 산출 조건)에
// 도달해야 취약도 지수가 "측정 중"을 벗어나기 때문이다.

import { LURE_TYPES, MIN_EXPOSURES } from './vulnerability.js';

// 1회차 진단은 권위·공포부터 — 피해 구성비 1위인 기관사칭형이 이 두 자극에 몰려 있다.
export const DIAGNOSTIC_LURES = ['권위', '공포'];
export const SCAMS_PER_LURE = MIN_EXPOSURES;

function shuffled(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function preferSegment(items, segment, needed) {
  const matched = items.filter(
    (item) => item.target_segment === segment || item.target_segment === 'all',
  );
  // 세그먼트 풀이 부족하면 전체 풀로 폴백
  return matched.length >= needed ? matched : items;
}

/**
 * 다음 세션에서 집중 노출할 자극 유형 2종을 고른다.
 * 측정된 유형 중 가장 취약한 것을 1순위로 유지해 1회차 대비 개선폭을 계속 볼 수 있게 하고,
 * 2순위는 아직 측정되지 않은 유형에 배정해 측정 범위를 넓힌다.
 * @param {Record<string, {status: string, score: number|null}>} index 누적 취약도 지수
 * @returns {[string, string]}
 */
export function selectFocusLures(index) {
  const measured = LURE_TYPES.filter((lure) => index?.[lure]?.status === 'measured').sort(
    (a, b) => index[b].score - index[a].score,
  );
  if (measured.length === 0) return [...DIAGNOSTIC_LURES];

  const primary = measured[0];
  const unmeasured = LURE_TYPES.filter((lure) => index?.[lure]?.status !== 'measured');
  const secondary =
    unmeasured[0] ?? measured.find((lure) => lure !== primary) ?? LURE_TYPES.find((l) => l !== primary);
  return [primary, secondary];
}

function pickScams(items, lure, segment, count, rng) {
  const pool = items.filter((item) => item.is_scam && item.lure === lure);
  return shuffled(preferSegment(pool, segment, count), rng).slice(0, count);
}

// 라운드별 사기 개수 — 라운드마다 최소 1건, 나머지는 무작위 배분.
// 매 라운드 개수가 같으면 "몇 개 고르면 된다"는 요령이 생겨 훈련이 아니라 패턴 맞히기가 된다.
function scamCounts(total, rounds, perRound, rng) {
  const counts = new Array(rounds).fill(1);
  const order = shuffled([...counts.keys()], rng);
  let remain = total - rounds;

  // 1차: 무작위로 나눠 담는다
  for (const i of order) {
    const room = Math.min(perRound - counts[i], remain);
    if (room <= 0) continue;
    const add = Math.floor(rng() * (room + 1));
    counts[i] += add;
    remain -= add;
  }
  // 2차: 남은 몫을 순차로 마저 채워 합계를 보장한다
  for (const i of order) {
    while (remain > 0 && counts[i] < perRound) {
      counts[i] += 1;
      remain -= 1;
    }
  }
  return counts;
}

/**
 * 한 세션의 라운드 목록을 만든다.
 * @param {Array} items 데이터셋 문항
 * @param {{segment: string}} profile 문해 프로파일
 * @param {{lures?: string[], rounds?: number, perRound?: number, perLure?: number, rng?: () => number}} options
 * @returns {Array<Array>} 라운드 배열
 */
export function buildSession(items, profile, options = {}) {
  const {
    lures = DIAGNOSTIC_LURES,
    rounds = 3,
    perRound = 3,
    perLure = SCAMS_PER_LURE,
    rng = Math.random,
  } = options;

  const scams = shuffled(
    lures.flatMap((lure) => pickScams(items, lure, profile.segment, perLure, rng)),
    rng,
  );
  const legitNeeded = rounds * perRound - scams.length;
  const legits = shuffled(
    preferSegment(items.filter((item) => !item.is_scam), profile.segment, legitNeeded),
    rng,
  ).slice(0, legitNeeded);

  const counts = scamCounts(scams.length, rounds, perRound, rng);

  const result = [];
  let scamCursor = 0;
  let legitCursor = 0;
  for (let r = 0; r < rounds; r += 1) {
    const scamCount = counts[r];
    const picked = [
      ...scams.slice(scamCursor, scamCursor + scamCount),
      ...legits.slice(legitCursor, legitCursor + (perRound - scamCount)),
    ];
    scamCursor += scamCount;
    legitCursor += perRound - scamCount;
    if (picked.length < perRound) break; // 풀 소진 시 안전 종료
    result.push(shuffled(picked, rng));
  }
  return result;
}

export function gradeRound(round, selectedIds) {
  const scamIds = round.filter((i) => i.is_scam).map((i) => i.id);
  const selected = [...selectedIds];
  const correct =
    scamIds.length === selected.length && scamIds.every((id) => selected.includes(id));
  return { correct, scamIds };
}

/**
 * 한 라운드의 노출 기록. 판별 퀴즈형에서 피격(hit)은
 * "사기 시나리오를 정상으로 판정한 것" 하나로 규칙 판정한다(링크 클릭·정보 입력은 해당 없음).
 * @param {Array} round 라운드 문항
 * @param {string[]} selectedIds 사용자가 사기로 지목한 문항
 * @returns {Array<{id: string, lure: string|null, hit: boolean}>}
 */
export function roundExposures(round, selectedIds) {
  return round
    .filter((item) => item.is_scam)
    .map((item) => ({
      id: item.id,
      lure: item.lure ?? null,
      hit: !selectedIds.includes(item.id),
    }));
}
