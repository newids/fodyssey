import { useState } from 'react';
import { gradeRound, roundExposures } from '../lib/quiz.js';
import { buildExplanation } from '../lib/adaptive.js';
import Explain from './Explain.jsx';

export default function Quiz({ rounds, profile, sessionRound, onFinish }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [exposures, setExposures] = useState([]);

  const round = rounds[roundIndex];
  if (!round) return null;

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = () => {
    const grade = gradeRound(round, selected);
    if (grade.correct) setCorrectCount((c) => c + 1);
    // 피격 판정은 규칙 기반 — 사기 문항을 지목하지 못하면 피격으로 센다
    setExposures((prev) => [...prev, ...roundExposures(round, selected)]);
    setExplanation(buildExplanation(round, grade, profile));
  };

  const nextRound = () => {
    setExplanation(null);
    setSelected([]);
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
    } else {
      onFinish({ score: correctCount, total: rounds.length, exposures }); // submit 시점에 이미 반영된 값
    }
  };

  if (explanation) {
    return (
      <Explain
        explanation={explanation}
        round={round}
        isLast={roundIndex + 1 >= rounds.length}
        onNext={nextRound}
      />
    );
  }

  return (
    <section className="fade-in" key={roundIndex}>
      <p className="muted">
        {sessionRound}회차 훈련 · {roundIndex + 1} / {rounds.length} 라운드
      </p>
      <h2>사기 문자를 모두 골라 주세요</h2>
      <p className="muted">문자를 누르면 지목됩니다. 몇 개가 사기인지는 알려 드리지 않습니다.</p>
      <div className="phone mt" role="group" aria-label="받은 문자 목록">
        {round.map((item) => (
          <button
            key={item.id}
            type="button"
            className="msg"
            aria-pressed={selected.includes(item.id)}
            onClick={() => toggle(item.id)}
          >
            {item.body}
          </button>
        ))}
      </div>
      <div className="mt">
        <button
          type="button"
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={submit}
        >
          이걸로 제출하기
        </button>
      </div>
    </section>
  );
}
