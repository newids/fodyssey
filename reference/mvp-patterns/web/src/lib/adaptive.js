// 적응형 해설 렌더링 (프로토타입의 전달 규칙을 클라이언트에서 구현)
// 판단 근거는 프로파일과 무관하게 동일, 전달 방식만 달라진다 — P2의 핵심.
// 해설 텍스트는 데이터셋의 판별 단서(clues)에서 생성 — LLM 실시간 호출 없음(사전 캐시 원칙).

const TYPE_ACTIONS = {
  기관사칭: '이런 문자는 지우세요. 확인이 필요하면 그 기관의 대표번호를 직접 찾아 전화하세요.',
  대출빙자: '이런 문자는 지우세요. 대출은 은행 창구나 공식 앱에서만 알아보세요.',
  지인사칭: '먼저 그 사람의 원래 번호로 직접 전화해 확인하세요. 확인 전에는 절대 보내지 마세요.',
  악성앱: '문자 속 링크는 누르지 말고 지우세요. 확인은 공식 앱에서만 하세요.',
};

const REASSURE = '괜찮습니다. 지금은 훈련이니까 틀려도 잃는 것이 없습니다.';

export function buildExplanation(round, grade, profile) {
  const scamItems = round.filter((item) => item.is_scam);
  const isSteps = profile.literacy_level === 1 || profile.format === 'step-by-step';
  return isSteps
    ? buildSteps(scamItems, grade, profile)
    : buildCard(scamItems, grade);
}

function buildSteps(scamItems, grade) {
  const first = scamItems[0];
  const steps = [
    {
      title: grade.correct ? '정답입니다!' : '아쉽지만 괜찮습니다',
      lines: grade.correct
        ? ['사기 문자를 정확히 골라내셨어요.', '실전에서도 이렇게 한 박자 멈추면 됩니다.']
        : [`사기 문자는 ${grade.scamIds.length}개 있었습니다.`, REASSURE],
    },
    {
      title: '무엇을 보고 알 수 있었을까요?',
      // 초심자 단계에서는 단서를 2개까지만 — 한 번에 하나의 개념
      lines: scamItems.flatMap((item) => item.clues.slice(0, 2)),
    },
    {
      title: '지금 기억할 것 한 가지',
      lines: [TYPE_ACTIONS[first?.type] ?? TYPE_ACTIONS['악성앱']],
    },
  ];
  return { mode: 'steps', steps, scamIds: grade.scamIds, correct: grade.correct };
}

function buildCard(scamItems, grade) {
  return {
    mode: 'card',
    correct: grade.correct,
    scamIds: grade.scamIds,
    verdict: grade.correct ? '정답 — 사기 판별 성공' : `오답 — 사기는 ${grade.scamIds.length}건`,
    clues: scamItems.flatMap((item) =>
      item.clues.map((clue) => ({ id: item.id, type: item.type, clue })),
    ),
    action: scamItems.length
      ? TYPE_ACTIONS[scamItems[0].type]
      : TYPE_ACTIONS['악성앱'],
  };
}
