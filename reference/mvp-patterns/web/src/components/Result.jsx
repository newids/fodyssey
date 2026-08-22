import VulnerabilityPanel from './VulnerabilityPanel.jsx';
import ShareCard from './ShareCard.jsx';

export default function Result({
  summary,
  index,
  improvement,
  profile,
  onRestart,
  onReprofile,
  onOpenReport,
}) {
  const { score, total, rounds, rulesViewed } = summary;
  const perfect = score === total;

  return (
    <section className="fade-in">
      <h2>{rounds}회차 훈련 결과</h2>
      <p className="score">
        {score} / {total}
      </p>
      <p className="mt">
        {perfect
          ? '전부 골라내셨습니다. 실전에서도 오늘처럼 한 박자 멈추고 확인하면 됩니다.'
          : '틀린 문제가 진짜 공부입니다. 같은 수법은 실전에서 다시 나타납니다.'}
      </p>
      <p className="muted mt">
        대응 수칙 학습: {rulesViewed ? '완료' : '건너뜀'}
        {rulesViewed
          ? ''
          : ' — 수칙을 보지 않고 측정한 회차는 기준선으로 삼기 어렵습니다.'}
      </p>

      <VulnerabilityPanel index={index} improvement={improvement} rounds={rounds} />

      <div className="stack mt">
        <button type="button" className="btn-primary" onClick={onRestart}>
          {rounds + 1}회차 훈련하기
        </button>
        <button type="button" onClick={onOpenReport}>
          기관 금융역량 진단 리포트 (예시 데이터)
        </button>
      </div>

      <ShareCard index={index} summary={summary} />

      <p className="muted mt">
        현재 설명 방식: {profile.format === 'step-by-step' ? '차근차근 단계별' : '요점 카드'}
        {profile.large_text ? ' · 큰 글씨' : ''}
      </p>
      <div className="mt">
        <button type="button" onClick={onReprofile}>
          설명 방식·훈련 기록 다시 시작하기
        </button>
      </div>
    </section>
  );
}
