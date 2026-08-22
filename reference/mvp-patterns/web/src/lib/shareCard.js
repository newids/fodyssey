// 훈련 결과 공유 카드 (전략 v1.3 §3-7′) — 전달되는 것은 서비스 경험이지 금융 판단이 아니다.
// 서버 전송 없음. 텍스트에 개인 식별 정보를 담지 않는다(이름·연락처·문항 원문 없음).

import { LURE_TYPES } from './vulnerability.js';

export const SHARE_DISCLAIMER = '이 카드는 훈련 결과 공유일 뿐 금융 판단의 조언이 아닙니다.';

const PENDING_LABEL = '측정 중';

/**
 * 공유용 텍스트를 만든다.
 * @param {Record<string, {status: string, score: number|null}>} index 취약도 지수
 * @param {{rounds: number}} summary 회차 요약
 * @returns {string}
 */
export function buildShareText(index, summary = {}) {
  const measured = LURE_TYPES.filter((lure) => index?.[lure]?.status === 'measured').sort(
    (a, b) => index[b].score - index[a].score,
  );
  const weakest = measured[0];

  const lines = [
    '[금융안전 실습 결과]',
    `훈련 ${summary.rounds ?? 1}회차까지 마쳤습니다.`,
    weakest
      ? `제가 가장 약한 자극은 "${weakest}"입니다. (취약도 ${index[weakest].score})`
      : `아직 자극 유형별 취약도는 ${PENDING_LABEL}입니다.`,
    '',
    '자극 유형별 취약도(낮을수록 안전)',
    ...LURE_TYPES.map((lure) => {
      const entry = index?.[lure];
      const value = entry?.status === 'measured' ? `${entry.score}` : PENDING_LABEL;
      return `- ${lure}: ${value}`;
    }),
    '',
    SHARE_DISCLAIMER,
  ];

  return lines.join('\n');
}
