import { useState } from 'react';
import { buildBriefing } from '../lib/rules.js';

// 훈련 루프 1단계 — 대응 수칙 사전 교육.
// 예고 없이 오는 것은 개별 문자의 시점이지, 훈련 참여 사실이나 대응 수칙이 아니다.

function StepBriefing({ rules, onDone, onSkip }) {
  const [index, setIndex] = useState(0);
  const rule = rules[index];
  const isLast = index + 1 >= rules.length;

  return (
    <section className="fade-in" key={rule.id}>
      <div className="step-panel">
        <p className="step-meta">
          수칙 {index + 1} / {rules.length}
        </p>
        <h3>{rule.title}</h3>
        {rule.steps.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="stack mt">
        <button
          type="button"
          className="btn-primary"
          onClick={() => (isLast ? onDone() : setIndex(index + 1))}
        >
          {isLast ? '수칙을 익혔습니다 · 훈련 시작' : '다음 ▶'}
        </button>
        <button type="button" onClick={onSkip}>
          이미 알고 있어요 · 건너뛰기
        </button>
      </div>
    </section>
  );
}

function CardBriefing({ rules, onDone, onSkip }) {
  return (
    <section className="fade-in">
      <div className="explain-card">
        <ul className="rule-list">
          {rules.map((rule) => (
            <li key={rule.id}>
              <strong>{rule.title}</strong>
              <span>{rule.card}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="stack mt">
        <button type="button" className="btn-primary" onClick={onDone}>
          수칙을 익혔습니다 · 훈련 시작
        </button>
        <button type="button" onClick={onSkip}>
          이미 알고 있어요 · 건너뛰기
        </button>
      </div>
    </section>
  );
}

export default function Briefing({ profile, round, onDone, onSkip }) {
  const briefing = buildBriefing(profile);

  return (
    <>
      <section className="fade-in">
        <p className="muted">{round}회차 훈련 · 1단계</p>
        <h2>먼저, 대응 수칙 4가지</h2>
        <p className="muted">
          3분이면 됩니다. 수칙을 모르는 채로 틀리는 것은 훈련이 아니라 그냥 사고입니다.
          훈련 문자는 예고 없이 나오지만, 조심할 것은 지금 미리 알려 드립니다.
        </p>
      </section>
      {briefing.mode === 'steps' ? (
        <StepBriefing rules={briefing.rules} onDone={onDone} onSkip={onSkip} />
      ) : (
        <CardBriefing rules={briefing.rules} onDone={onDone} onSkip={onSkip} />
      )}
    </>
  );
}
