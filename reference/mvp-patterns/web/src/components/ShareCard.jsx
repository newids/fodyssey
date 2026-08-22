import { useState } from 'react';
import { buildShareText } from '../lib/shareCard.js';

// 훈련 결과 공유 (전략 §3-7′ 개인 확산 채널).
// 서버로 보내지 않는다 — 기기의 공유 시트 또는 클립보드까지가 전부다.

const IDLE = { tone: '', message: '' };

export default function ShareCard({ index, summary }) {
  const [state, setState] = useState(IDLE);
  const text = buildShareText(index, summary);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text });
        setState({ tone: 'ok', message: '공유 창을 열었습니다.' });
        return;
      }
      await navigator.clipboard.writeText(text);
      setState({ tone: 'ok', message: '복사했습니다. 가족·지인에게 붙여넣어 보내세요.' });
    } catch {
      setState({ tone: 'bad', message: '아래 내용을 직접 선택해 복사해 주세요.' });
    }
  };

  return (
    <section className="panel mt" aria-labelledby="share-title">
      <h3 id="share-title">결과 카드 보내기</h3>
      <p className="muted">
        내가 어떤 자극에 약한지만 담깁니다. 이름·연락처·문자 내용은 들어가지 않습니다.
      </p>
      <pre className="share-preview">{text}</pre>
      <div className="mt">
        <button type="button" className="btn-primary" onClick={share}>
          결과 카드 복사·공유하기
        </button>
      </div>
      {state.message && (
        <p className={`muted share-status ${state.tone}`} role="status">
          {state.message}
        </p>
      )}
    </section>
  );
}
