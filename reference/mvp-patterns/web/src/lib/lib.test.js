import { describe, test, expect } from 'vitest';
import { deriveProfile } from './profile.js';
import {
  buildSession,
  gradeRound,
  roundExposures,
  selectFocusLures,
  DIAGNOSTIC_LURES,
} from './quiz.js';
import { buildExplanation } from './adaptive.js';
import dataset from '@data/scam_dataset_v0.1.json';

const items = dataset.items;

function seededRng(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('deriveProfile', () => {
  test('maps low banking familiarity to senior segment with step-by-step default', () => {
    const profile = deriveProfile({ banking: 1 });
    expect(profile.literacy_level).toBe(1);
    expect(profile.segment).toBe('senior');
    expect(profile.format).toBe('step-by-step');
    expect(profile.large_text).toBe(true);
  });

  test('maps frequent banking to youth segment with summary card default', () => {
    const profile = deriveProfile({ banking: 3 });
    expect(profile.segment).toBe('youth');
    expect(profile.format).toBe('summary-card');
    expect(profile.large_text).toBe(false);
  });

  test('respects explicit style and text-size answers over defaults', () => {
    const profile = deriveProfile({ banking: 3, style: 'step-by-step', text: true });
    expect(profile.format).toBe('step-by-step');
    expect(profile.large_text).toBe(true);
  });
});

describe('buildSession', () => {
  const profile = deriveProfile({ banking: 1 });

  test('한 세션은 3라운드 × 3건이고 사기 6건(유형 2종 × 3건) + 정상 3건이다', () => {
    const rounds = buildSession(items, profile, { rng: seededRng() });
    expect(rounds).toHaveLength(3);
    const flat = rounds.flat();
    expect(flat).toHaveLength(9);
    const scams = flat.filter((i) => i.is_scam);
    expect(scams).toHaveLength(6);
    // 자극 유형별 3건 — 최소 노출 3건을 채워야 취약도 지수가 산출된다
    for (const lure of DIAGNOSTIC_LURES) {
      expect(scams.filter((i) => i.lure === lure)).toHaveLength(3);
    }
    // 오탐 훈련용 정상 문항이 매 세션 포함된다
    expect(flat.filter((i) => !i.is_scam)).toHaveLength(3);
  });

  test('라운드마다 사기 개수가 1건 이상이고 중복 문항이 없다', () => {
    const rounds = buildSession(items, profile, { rng: seededRng(11) });
    const seen = new Set();
    for (const round of rounds) {
      expect(round).toHaveLength(3);
      expect(round.filter((i) => i.is_scam).length).toBeGreaterThanOrEqual(1);
      for (const item of round) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
  });

  test('난수 시드가 달라도 항상 3라운드 × 3건, 사기 6건을 유지한다', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const rounds = buildSession(items, profile, { rng: seededRng(seed) });
      expect(rounds).toHaveLength(3);
      expect(rounds.every((round) => round.length === 3)).toBe(true);
      expect(rounds.flat().filter((i) => i.is_scam)).toHaveLength(6);
    }
  });

  test('지정한 집중 유형만 사기 문항으로 나온다', () => {
    const rounds = buildSession(items, profile, { lures: ['친밀', '이득'], rng: seededRng(3) });
    for (const item of rounds.flat().filter((i) => i.is_scam)) {
      expect(['친밀', '이득']).toContain(item.lure);
    }
  });

  test('시니어 프로파일 세션에는 청년 전용 문항이 섞이지 않는다', () => {
    const rounds = buildSession(items, profile, { rng: seededRng(7) });
    for (const item of rounds.flat()) {
      expect(['senior', 'all']).toContain(item.target_segment);
    }
  });
});

describe('selectFocusLures', () => {
  const measured = (score) => ({ status: 'measured', score });
  const pending = { status: 'pending', score: null };

  test('측정된 유형이 없으면 진단용 기본 2종을 쓴다', () => {
    expect(selectFocusLures({})).toEqual(DIAGNOSTIC_LURES);
  });

  test('가장 취약한 측정 유형을 1순위로, 미측정 유형을 2순위로 고른다', () => {
    const index = {
      권위: measured(20),
      공포: measured(80),
      이득: pending,
      긴급: pending,
      친밀: pending,
    };
    const [primary, secondary] = selectFocusLures(index);
    expect(primary).toBe('공포');
    expect(index[secondary].status).toBe('pending');
  });
});

describe('roundExposures', () => {
  const round = [
    { id: 'S1', is_scam: true, lure: '권위' },
    { id: 'S2', is_scam: true, lure: '공포' },
    { id: 'L1', is_scam: false, lure: null },
  ];

  test('사기 문항만 노출로 세고, 지목하지 못한 문항을 피격으로 기록한다', () => {
    const exposures = roundExposures(round, ['S1']);
    expect(exposures).toHaveLength(2);
    expect(exposures.find((e) => e.id === 'S1').hit).toBe(false);
    expect(exposures.find((e) => e.id === 'S2').hit).toBe(true);
    expect(exposures.every((e) => e.lure)).toBe(true);
  });
});

describe('gradeRound', () => {
  const round = [
    { id: 'A', is_scam: true },
    { id: 'B', is_scam: false },
    { id: 'C', is_scam: true },
  ];

  test('correct when exactly all scams are selected', () => {
    expect(gradeRound(round, ['A', 'C']).correct).toBe(true);
    expect(gradeRound(round, ['C', 'A']).correct).toBe(true);
  });

  test('incorrect on partial or extra selection', () => {
    expect(gradeRound(round, ['A']).correct).toBe(false);
    expect(gradeRound(round, ['A', 'B', 'C']).correct).toBe(false);
  });
});

describe('buildExplanation', () => {
  const round = items.filter((i) => ['S01', 'L01', 'L05'].includes(i.id));
  const grade = { correct: false, scamIds: ['S01'] };

  test('literacy 1 gets step mode, max 3 steps, reassurance first', () => {
    const profile = deriveProfile({ banking: 1 });
    const explanation = buildExplanation(round, grade, profile);
    expect(explanation.mode).toBe('steps');
    expect(explanation.steps.length).toBeLessThanOrEqual(3);
    expect(explanation.steps[0].lines.join(' ')).toContain('괜찮습니다');
  });

  test('literacy 3 with summary-card gets a single card with all clues', () => {
    const profile = deriveProfile({ banking: 3 });
    const explanation = buildExplanation(round, grade, profile);
    expect(explanation.mode).toBe('card');
    const s01 = items.find((i) => i.id === 'S01');
    expect(explanation.clues.length).toBe(s01.clues.length);
    expect(explanation.action).toBeTruthy();
  });

  test('same round yields same evidence regardless of profile (P2 invariant)', () => {
    const seniorSteps = buildExplanation(round, grade, deriveProfile({ banking: 1 }));
    const youthCard = buildExplanation(round, grade, deriveProfile({ banking: 3 }));
    // 전달 형식은 달라도 근거의 출처(사기 문항)는 동일
    expect(seniorSteps.scamIds).toEqual(youthCard.scamIds);
  });
});
