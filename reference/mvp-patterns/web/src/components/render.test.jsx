// 화면 렌더 스모크 — 브라우저 없이 정적 렌더로 컴포넌트 크래시와 필수 문구를 확인한다.
import { describe, test, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import dataset from '@data/scam_dataset_v0.1.json';
import App from '../App.jsx';
import Briefing from './Briefing.jsx';
import Quiz from './Quiz.jsx';
import Result from './Result.jsx';
import CohortReport from './CohortReport.jsx';
import { deriveProfile } from '../lib/profile.js';
import { buildSession } from '../lib/quiz.js';
import { appendSession, overallIndex, improvementByLure, historySummary } from '../lib/history.js';
import { SHARE_DISCLAIMER } from '../lib/shareCard.js';
import { SYNTHETIC_BADGE } from '../lib/cohortDemo.js';

const profile = deriveProfile({ banking: 1 });
const history = appendSession([], {
  exposures: [
    { id: 'S01', lure: '권위', hit: true },
    { id: 'S02', lure: '권위', hit: false },
    { id: 'S03', lure: '권위', hit: false },
  ],
  rulesViewed: false,
  score: 2,
  total: 3,
});

describe('정적 렌더 스모크', () => {
  test('첫 화면은 대응 수칙부터 시작한다고 안내한다', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('대응 수칙');
    expect(html).toContain('시작하기');
  });

  test('앱 헤더는 금융안전 실습 프로토타입으로 표기한다 — B2G 노출 표면', () => {
    expect(renderToStaticMarkup(<App />)).toContain('금융 코디세이 · 금융안전 실습 프로토타입');
  });

  test('사전 수칙 화면은 4개 수칙과 건너뛰기를 제공한다', () => {
    const html = renderToStaticMarkup(
      <Briefing profile={profile} round={1} onDone={() => {}} onSkip={() => {}} />,
    );
    expect(html).toContain('대응 수칙 4가지');
    expect(html).toContain('건너뛰기');
  });

  test('결과 화면은 취약도·산식·수칙 열람 여부·공유 고지를 함께 보여 준다', () => {
    const html = renderToStaticMarkup(
      <Result
        summary={historySummary(history)}
        index={overallIndex(history)}
        improvement={improvementByLure(history)}
        profile={profile}
        onRestart={() => {}}
        onReprofile={() => {}}
        onOpenReport={() => {}}
      />,
    );
    expect(html).toContain('자극 유형별 취약도');
    expect(html).toContain('취약도 = ');
    expect(html).toContain('건너뜀');
    expect(html).toContain('측정 중');
    expect(html).toContain(SHARE_DISCLAIMER);
    // 리포트 진입 버튼만 B2G 표기를 쓴다 — 같은 화면의 학습자 문안은 쉬운 말 유지
    expect(html).toContain('기관 금융역량 진단 리포트 (예시 데이터)');
  });

  test('퀴즈 화면은 회차·라운드와 문자 목록을 그린다', () => {
    const rounds = buildSession(dataset.items, profile);
    const html = renderToStaticMarkup(
      <Quiz rounds={rounds} profile={profile} sessionRound={2} onFinish={() => {}} />,
    );
    expect(html).toContain('2회차 훈련');
    expect(html).toContain('1 / 3 라운드');
    expect(html).toContain('이걸로 제출하기');
  });

  test('기관 금융역량 진단 리포트 화면은 합성 데이터 배지와 표본 미달 행을 노출한다', () => {
    const html = renderToStaticMarkup(<CohortReport onBack={() => {}} />);
    expect(html).toContain('기관 금융역량 진단 리포트 (미리보기)');
    expect(html).toContain(SYNTHETIC_BADGE);
    expect(html).toContain('표본 미달');
  });
});
