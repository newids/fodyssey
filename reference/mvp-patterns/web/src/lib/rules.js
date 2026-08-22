// 대응 수칙 사전 교육 (훈련 루프 1단계) — 전략 v1.3 §3-4′ ①
// 유형별 지식이 아니라 행동 규칙 4개다. 수칙을 모르는 상태의 실패는 학습이 아니라 좌절이고,
// 훈련 전후 비교의 기준선도 오염되기 때문에 1회차 측정 직전에 배치한다.

export const RESPONSE_RULES = [
  {
    id: 'no-link',
    title: '문자 속 링크와 전화번호는 쓰지 않습니다',
    steps: [
      '문자에 적힌 주소(링크)를 누르지 않습니다.',
      '문자에 적힌 전화번호로 걸지 않습니다.',
      '진짜 기관의 문자라도 이 규칙은 그대로 지킵니다.',
    ],
    card: '링크·회신 번호는 사용하지 않는다. 진짜 문자라도 예외 없이.',
  },
  {
    id: 'official-channel',
    title: '확인은 공식 앱이나 대표번호로 합니다',
    steps: [
      '내가 이미 쓰고 있는 공식 앱을 엽니다.',
      '또는 카드 뒷면·홈페이지에 있는 대표번호로 직접 겁니다.',
      '확인 경로를 상대가 정해 주면 그것이 위험 신호입니다.',
    ],
    card: '확인 경로는 내가 고른다 — 공식 앱, 대표번호, 창구.',
  },
  {
    id: 'no-transfer',
    title: '돈을 옮기라는 요구는 예외 없이 사기입니다',
    steps: [
      '"안전계좌로 옮기세요"라는 제도는 없습니다.',
      '수사기관도 금융회사도 돈을 옮기라고 하지 않습니다.',
      '상품권 번호·계좌 이체·선입금 요구도 같습니다.',
    ],
    card: '안전계좌·선입금·상품권 핀번호 요구 = 사기. 기관은 자금 이동을 요구하지 않는다.',
  },
  {
    id: 'pause',
    title: '급할수록 한 박자 멈춥니다',
    steps: [
      '"오늘까지", "즉시"라는 말이 보이면 일단 멈춥니다.',
      '가족이나 아는 사람에게 한 번 말해 봅니다.',
      '진짜 급한 일은 30분 뒤에도 급합니다.',
    ],
    card: '"오늘까지·즉시"는 판단을 뺏는 장치다. 멈추고 다른 경로로 확인한다.',
  },
];

/**
 * 프로파일에 맞춘 수칙 전달 방식. 근거(수칙 내용)는 동일하고 전달 형식만 달라진다.
 * @param {{literacy_level: number, format: string}} profile
 * @returns {{mode: 'steps'|'card', rules: typeof RESPONSE_RULES}}
 */
export function buildBriefing(profile) {
  const isSteps = profile?.literacy_level === 1 || profile?.format === 'step-by-step';
  return { mode: isSteps ? 'steps' : 'card', rules: RESPONSE_RULES };
}
