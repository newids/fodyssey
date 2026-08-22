// 훈련 루프 통합 검증 — 진단(1회차) → 집중 노출(2회차) → 재측정 델타
import { describe, test, expect } from 'vitest';
import dataset from '@data/scam_dataset_v0.1.json';
import { deriveProfile } from './profile.js';
import { buildSession, roundExposures, selectFocusLures } from './quiz.js';
import { appendSession, overallIndex, improvementByLure } from './history.js';

const items = dataset.items;

function seededRng(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// 한 세션을 통째로 치른다. mode='miss'면 아무것도 지목하지 않아 전부 피격,
// mode='catch'면 사기를 전부 지목해 무피격.
function playSession(profile, lures, rng, mode) {
  const rounds = buildSession(items, profile, { lures, rng });
  const exposures = rounds.flatMap((round) =>
    roundExposures(
      round,
      mode === 'catch' ? round.filter((i) => i.is_scam).map((i) => i.id) : [],
    ),
  );
  const score = mode === 'catch' ? rounds.length : 0;
  return { exposures, score, total: rounds.length, rulesViewed: true };
}

describe('훈련 루프 — 회차 델타', () => {
  const profile = deriveProfile({ banking: 2 });

  test('1회차 진단만으로 두 자극 유형의 취약도가 산출된다', () => {
    const lures = selectFocusLures(overallIndex([]));
    const history = appendSession([], playSession(profile, lures, seededRng(), 'miss'));
    const index = overallIndex(history);

    for (const lure of lures) {
      expect(index[lure].exposures).toBe(3);
      expect(index[lure].status).toBe('measured');
      expect(index[lure].score).toBe(100);
    }
    // 다루지 않은 유형은 측정 중으로 남는다
    expect(Object.values(index).filter((e) => e.status === 'pending')).toHaveLength(3);
  });

  test('2회차는 가장 취약한 유형을 집중 노출하고, 개선폭이 산출된다', () => {
    const firstLures = selectFocusLures(overallIndex([]));
    let history = appendSession([], playSession(profile, firstLures, seededRng(), 'miss'));

    const secondLures = selectFocusLures(overallIndex(history));
    expect(firstLures).toContain(secondLures[0]); // 1순위 = 1회차에서 가장 취약했던 유형
    history = appendSession(history, playSession(profile, secondLures, seededRng(9), 'catch'));

    const improvement = improvementByLure(history);
    const focus = improvement[secondLures[0]];
    expect(focus.status).toBe('measured');
    expect(focus.first).toBe(100);
    expect(focus.latest).toBe(0);
    expect(focus.delta).toBe(100); // 양수 = 개선

    // 1회차에 측정되지 않았던 유형은 개선폭을 내지 않는다
    expect(improvement[secondLures[1]].status).toBe('pending');
  });

  test('매 세션에 정상 문항이 섞여 오탐 훈련이 유지된다', () => {
    const rounds = buildSession(items, profile, { rng: seededRng(5) });
    expect(rounds.flat().filter((i) => !i.is_scam).length).toBeGreaterThan(0);
  });
});
