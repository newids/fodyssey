// 온보딩 진단 → 문해 프로파일 (MVP_스코프_v0.1.md §2-4, §3-1)
// "진단 테스트"처럼 보이지 않도록 질문 3개, 30초 이내.
// 뱅킹 사용 빈도를 문해 수준의 근사치로 쓰는 것은 MVP 단순화 —
// 파일럿에서 첫 미션 행동 신호(힌트 빈도·응답 시간)로 보정한다.

export const QUESTIONS = [
  {
    id: 'banking',
    text: '스마트폰으로 은행 일(이체, 잔액 확인)을 해보셨나요?',
    options: [
      { value: 3, label: '자주 해요' },
      { value: 2, label: '가끔 해요' },
      { value: 1, label: '거의 안 해봤어요' },
    ],
  },
  {
    id: 'style',
    text: '설명은 어떤 방식이 편하신가요?',
    options: [
      { value: 'summary-card', label: '요점만 간단히' },
      { value: 'step-by-step', label: '차근차근 한 단계씩' },
    ],
  },
  {
    id: 'text',
    text: '글씨 크기는 어떤 게 좋으세요?',
    options: [
      { value: false, label: '보통 크기' },
      { value: true, label: '큼직하게' },
    ],
  },
];

const SEGMENT_BY_LEVEL = { 1: 'senior', 2: 'all', 3: 'youth' };

export function deriveProfile(answers) {
  const level = answers.banking ?? 2;
  return {
    literacy_level: level,
    format: answers.style ?? (level === 1 ? 'step-by-step' : 'summary-card'),
    large_text: answers.text ?? level === 1,
    segment: SEGMENT_BY_LEVEL[level] ?? 'all',
  };
}
