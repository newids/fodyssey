import { describe, test, expect } from 'vitest';
import {
  appendSession,
  allExposures,
  overallIndex,
  improvementByLure,
  latestSession,
} from './history.js';

const exposures = (lure, hits) =>
  hits.map((hit, i) => ({ id: `${lure}-${i}`, lure, hit }));

const session = (lure, hits, extra = {}) => ({
  exposures: exposures(lure, hits),
  rulesViewed: true,
  score: 2,
  total: 3,
  ...extra,
});

describe('appendSession', () => {
  test('회차 번호를 1부터 매기고 원본 이력을 변경하지 않는다', () => {
    const first = appendSession([], session('권위', [true, true, true]));
    const second = appendSession(first, session('권위', [false, false, false]));
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);
    expect(second[0].round).toBe(1);
    expect(second[1].round).toBe(2);
    expect(latestSession(second).round).toBe(2);
  });

  test('수칙 열람 여부와 점수를 회차 기록에 남긴다', () => {
    const [record] = appendSession([], session('권위', [true], { rulesViewed: false, score: 1 }));
    expect(record.rulesViewed).toBe(false);
    expect(record.score).toBe(1);
    expect(typeof record.at).toBe('string');
  });
});

describe('allExposures / overallIndex', () => {
  test('모든 회차의 노출에 회차 번호를 붙여 누적한다', () => {
    const history = appendSession(
      appendSession([], session('권위', [true, true, true])),
      session('권위', [false, false, false]),
    );
    const flat = allExposures(history);
    expect(flat).toHaveLength(6);
    expect(flat.filter((e) => e.round === 2)).toHaveLength(3);
  });

  test('누적 지수는 최근 회차를 더 무겁게 반영한다', () => {
    const improving = appendSession(
      appendSession([], session('권위', [true, true, true])),
      session('권위', [false, false, false]),
    );
    const worsening = appendSession(
      appendSession([], session('권위', [false, false, false])),
      session('권위', [true, true, true]),
    );
    expect(overallIndex(improving)['권위'].score).toBeLessThan(50);
    expect(overallIndex(worsening)['권위'].score).toBeGreaterThan(50);
  });
});

describe('improvementByLure — 1회차 대비 개선폭', () => {
  test('1회차만 있으면 개선폭을 산출하지 않는다', () => {
    const history = appendSession([], session('권위', [true, true, true]));
    expect(improvementByLure(history)['권위'].status).toBe('pending');
  });

  test('2회차부터 1회차 대비 개선폭을 유형별로 산출한다', () => {
    const history = appendSession(
      appendSession([], session('권위', [true, true, true])),
      session('권위', [false, false, true]),
    );
    const result = improvementByLure(history)['권위'];
    expect(result.status).toBe('measured');
    expect(result.first).toBe(100);
    expect(result.latest).toBeCloseTo(33.3, 5);
    expect(result.delta).toBeCloseTo(66.7, 5); // 양수 = 개선
  });

  test('1회차에 측정되지 않은 유형은 개선폭을 내지 않는다', () => {
    const history = appendSession(
      appendSession([], session('권위', [true, true, true])),
      session('친밀', [true, true, true]),
    );
    expect(improvementByLure(history)['친밀'].status).toBe('pending');
    expect(improvementByLure(history)['권위'].status).toBe('pending');
  });
});
