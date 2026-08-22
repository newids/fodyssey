import { useState } from 'react';

// 정답 공개된 문자 목록 — 어느 것이 사기였는지 색으로 표시
function RevealedMessages({ round }) {
  return (
    <div className="phone" aria-label="정답이 공개된 문자 목록">
      {round.map((item) => (
        <div
          key={item.id}
          className={`msg ${item.is_scam ? 'reveal-scam' : 'reveal-legit'}`}
        >
          {item.is_scam ? '🚨 사기' : '✅ 정상'} — {item.body}
        </div>
      ))}
    </div>
  );
}

// 단계별 해설 (literacy 1 / step-by-step): 한 번에 한 단계, [다음] 버튼
function StepExplain({ explanation, round, isLast, onNext }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = explanation.steps[stepIndex];
  const lastStep = stepIndex + 1 >= explanation.steps.length;

  return (
    <section className="fade-in" key={stepIndex}>
      <div className="step-panel">
        <p className="step-meta">
          단계 {stepIndex + 1} / {explanation.steps.length}
        </p>
        <h3>{step.title}</h3>
        {step.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mt">
        {lastStep ? (
          <>
            <RevealedMessages round={round} />
            <div className="mt">
              <button type="button" className="btn-primary" onClick={onNext}>
                {isLast ? '결과 보기' : '다음 문제로'}
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setStepIndex(stepIndex + 1)}>
            다음 ▶
          </button>
        )}
      </div>
    </section>
  );
}

// 카드 해설 (literacy 3 / summary-card): 한 화면에 전부
function CardExplain({ explanation, round, isLast, onNext }) {
  return (
    <section className="fade-in">
      <div className="explain-card">
        <p className={`verdict ${explanation.correct ? 'good' : 'bad'}`}>
          {explanation.verdict}
        </p>
        <div>
          <strong>왜 사기인가</strong>
          <ul className="clue-list">
            {explanation.clues.map(({ id, clue }) => (
              <li key={`${id}-${clue}`}>{clue}</li>
            ))}
          </ul>
        </div>
        <p className="action-line">{explanation.action}</p>
      </div>
      <div className="mt">
        <RevealedMessages round={round} />
      </div>
      <div className="mt">
        <button type="button" className="btn-primary" onClick={onNext}>
          {isLast ? '결과 보기' : '다음 문제로'}
        </button>
      </div>
    </section>
  );
}

export default function Explain(props) {
  return props.explanation.mode === 'steps' ? (
    <StepExplain {...props} />
  ) : (
    <CardExplain {...props} />
  );
}
