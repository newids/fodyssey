import { describe, test, expect } from 'vitest';
import { buildShareText, SHARE_DISCLAIMER } from './shareCard.js';
import { buildCohortReport, SYNTHETIC_BADGE } from './cohortDemo.js';
import { buildBriefing, RESPONSE_RULES } from './rules.js';
import { deriveProfile } from './profile.js';
import { LURE_TYPES, MIN_COHORT_SIZE } from './vulnerability.js';

const index = {
  권위: { status: 'measured', score: 66.7 },
  공포: { status: 'measured', score: 20 },
  이득: { status: 'pending', score: null },
  긴급: { status: 'pending', score: null },
  친밀: { status: 'pending', score: null },
};

describe('buildShareText — 결과 공유 카드', () => {
  test('가장 취약한 유형을 앞세우고 미측정 유형은 측정 중으로 표기한다', () => {
    const text = buildShareText(index, { rounds: 2 });
    expect(text).toContain('2회차');
    expect(text).toContain('"권위"');
    expect(text).toContain('- 이득: 측정 중');
  });

  test('금융 판단 조언이 아니라는 고지가 항상 들어간다', () => {
    expect(buildShareText(index, { rounds: 1 })).toContain(SHARE_DISCLAIMER);
    expect(buildShareText({}, {})).toContain(SHARE_DISCLAIMER);
  });

  test('개인 식별 정보나 문항 원문을 담지 않는다', () => {
    const text = buildShareText(index, { rounds: 2 });
    expect(text).not.toMatch(/010-|@|http/);
    expect(text).not.toMatch(/S\d{2}|L\d{2}/);
  });
});

describe('buildCohortReport — 기관 리포트 미리보기', () => {
  const report = buildCohortReport();

  test('합성 데이터 배지를 항상 함께 낸다', () => {
    expect(report.badge).toBe(SYNTHETIC_BADGE);
    expect(report.cohort.note).toContain('합성');
  });

  test('자극 유형 5종 행을 내고 그중 최소 표본 미달 행이 존재한다', () => {
    expect(report.rows.map((r) => r.lure)).toEqual(LURE_TYPES);
    const insufficient = report.rows.filter((r) => r.status === 'insufficient');
    expect(insufficient).toHaveLength(1);
    expect(insufficient[0].size).toBeLessThan(MIN_COHORT_SIZE);
    expect(insufficient[0].score).toBeNull();
  });

  test('산출된 행은 코호트 평균과 1회차 대비 개선폭(양수)을 갖는다', () => {
    for (const row of report.rows.filter((r) => r.status === 'measured')) {
      expect(row.size).toBeGreaterThanOrEqual(MIN_COHORT_SIZE);
      expect(row.score).toBeGreaterThanOrEqual(0);
      expect(row.score).toBeLessThanOrEqual(100);
      expect(row.delta).toBeGreaterThan(0);
    }
  });

  test('호출할 때마다 같은 값을 낸다 — 시드 고정', () => {
    expect(buildCohortReport().rows).toEqual(report.rows);
  });
});

describe('buildBriefing — 사전 대응 수칙', () => {
  test('행동 규칙 4개를 프로파일과 무관하게 동일하게 전달한다', () => {
    const senior = buildBriefing(deriveProfile({ banking: 1 }));
    const youth = buildBriefing(deriveProfile({ banking: 3 }));
    expect(RESPONSE_RULES).toHaveLength(4);
    expect(senior.rules).toEqual(youth.rules);
  });

  test('전달 형식만 프로파일에 따라 달라진다', () => {
    expect(buildBriefing(deriveProfile({ banking: 1 })).mode).toBe('steps');
    expect(buildBriefing(deriveProfile({ banking: 3 })).mode).toBe('card');
  });
});
