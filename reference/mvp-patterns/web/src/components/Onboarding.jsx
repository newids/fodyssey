import { useState } from 'react';
import { QUESTIONS, deriveProfile } from '../lib/profile.js';

export default function Onboarding({ onComplete }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const question = QUESTIONS[index];

  const answer = (value) => {
    const nextAnswers = { ...answers, [question.id]: value };
    if (index + 1 < QUESTIONS.length) {
      setAnswers(nextAnswers);
      setIndex(index + 1);
    } else {
      onComplete(deriveProfile(nextAnswers));
    }
  };

  return (
    <section className="fade-in" key={question.id}>
      <div className="progress-dots" aria-label={`질문 ${index + 1} / ${QUESTIONS.length}`}>
        {QUESTIONS.map((q, i) => (
          <span key={q.id} className={i <= index ? 'on' : ''} />
        ))}
      </div>
      <h2>{question.text}</h2>
      <div className="option-list">
        {question.options.map((option) => (
          <button key={option.label} type="button" onClick={() => answer(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
