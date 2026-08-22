import { useEffect, useMemo, useState } from 'react';
import dataset from '@data/scam_dataset_v0.1.json';
import Onboarding from './components/Onboarding.jsx';
import Briefing from './components/Briefing.jsx';
import Quiz from './components/Quiz.jsx';
import Result from './components/Result.jsx';
import CohortReport from './components/CohortReport.jsx';
import { buildSession, selectFocusLures } from './lib/quiz.js';
import { appendSession, overallIndex, improvementByLure, historySummary } from './lib/history.js';
import { loadProfile, saveProfile, loadHistory, saveHistory, clearAll } from './lib/storage.js';

// 훈련 루프 5단계: 대응 수칙 → 진단 → 예고 없는 노출 → 실패 해부 → 재측정
// 화면 순서: intro → onboarding → briefing → quiz(해설 포함) → result → (report)

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [history, setHistory] = useState(loadHistory);
  const [phase, setPhase] = useState(profile ? 'briefing' : 'intro');
  const [rulesViewed, setRulesViewed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.large = profile?.large_text ? 'true' : 'false';
  }, [profile]);

  const sessionRound = history.length + 1;

  // 다음 세션의 집중 자극 유형 — 1회차는 진단 기본값, 2회차부터 가장 취약한 유형
  const focusLures = useMemo(() => selectFocusLures(overallIndex(history)), [history]);

  const rounds = useMemo(
    () => (profile && phase === 'quiz' ? buildSession(dataset.items, profile, { lures: focusLures }) : []),
    [profile, phase, focusLures],
  );

  const index = useMemo(() => overallIndex(history), [history]);
  const improvement = useMemo(() => improvementByLure(history), [history]);
  const summary = useMemo(() => historySummary(history), [history]);

  const handleProfile = (nextProfile) => {
    setProfile(nextProfile);
    saveProfile(nextProfile);
    setPhase('briefing');
  };

  const startQuiz = (viewedRules) => {
    setRulesViewed(viewedRules);
    setPhase('quiz');
  };

  const handleFinish = (session) => {
    const nextHistory = appendSession(history, { ...session, rulesViewed });
    setHistory(nextHistory);
    saveHistory(nextHistory);
    setPhase('result');
  };

  const handleRestart = () => setPhase('briefing');

  const handleReprofile = () => {
    clearAll();
    setProfile(null);
    setHistory([]);
    setRulesViewed(false);
    setPhase('intro');
  };

  return (
    <main>
      <p className="kicker">금융 코디세이 · 금융안전 실습 프로토타입</p>
      {phase === 'intro' && (
        <section className="fade-in">
          <h1>사기 문자, 골라낼 수 있을까요?</h1>
          <p className="mt">
            강의는 없습니다. 대응 수칙을 3분 배우고, 진짜처럼 만든 문자 속에서 사기를 직접
            골라내는 훈련입니다. 훈련이니까 틀려도 잃는 것이 없습니다.
          </p>
          <p className="muted mt">
            먼저 세 가지만 여쭤볼게요. 답에 따라 설명 방식이 달라집니다.
          </p>
          <div className="mt">
            <button type="button" className="btn-primary" onClick={() => setPhase('onboarding')}>
              시작하기
            </button>
          </div>
        </section>
      )}
      {phase === 'onboarding' && <Onboarding onComplete={handleProfile} />}
      {phase === 'briefing' && profile && (
        <Briefing
          profile={profile}
          round={sessionRound}
          onDone={() => startQuiz(true)}
          onSkip={() => startQuiz(false)}
        />
      )}
      {phase === 'quiz' && profile && (
        <Quiz
          rounds={rounds}
          profile={profile}
          sessionRound={sessionRound}
          onFinish={handleFinish}
        />
      )}
      {phase === 'result' && profile && (
        <Result
          summary={summary}
          index={index}
          improvement={improvement}
          profile={profile}
          onRestart={handleRestart}
          onReprofile={handleReprofile}
          onOpenReport={() => setPhase('report')}
        />
      )}
      {phase === 'report' && <CohortReport onBack={() => setPhase('result')} />}
    </main>
  );
}
