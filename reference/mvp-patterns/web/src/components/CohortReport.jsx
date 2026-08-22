import { buildCohortReport } from '../lib/cohortDemo.js';

// 기관 리포트 미리보기 — 도입 기관에 제공되는 집계 화면의 구조를 보여 준다.
// 데이터는 전부 합성이며, 실제 훈련 기록과는 코드 경로가 분리돼 있다(cohortDemo.js 참조).

export default function CohortReport({ onBack }) {
  const report = buildCohortReport();

  return (
    <section className="fade-in">
      <p className="synthetic-badge" role="status">
        {report.badge} — 실제 사용자 기록이 아닙니다
      </p>
      <h2>기관 금융역량 진단 리포트 (미리보기)</h2>
      <p className="muted">
        {report.cohort.name} · {report.cohort.period} · 참여 {report.size}명
      </p>

      <div className="panel mt">
        <table className="report-table">
          <caption className="muted">
            코호트 취약도는 소속 사용자 지수의 평균(1인 1표)이고, 개선폭은 1회차와 최신 회차에
            모두 참여한 사람만으로 계산합니다.
          </caption>
          <thead>
            <tr>
              <th scope="col">자극 유형</th>
              <th scope="col">코호트 취약도</th>
              <th scope="col">1회차 대비 개선폭</th>
              <th scope="col">집계 인원</th>
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.lure} className={row.status === 'insufficient' ? 'row-muted' : ''}>
                <th scope="row">{row.lure}</th>
                <td>{row.status === 'measured' ? row.score : '표본 미달'}</td>
                <td>{row.status === 'measured' ? `▼ ${row.delta}` : '—'}</td>
                <td>{row.size}명</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted mt">
        최소 인원({report.minSample}명)에 미달하는 집단은 재식별을 막기 위해 산출하지 않습니다.
        {' '}
        {report.cohort.note}
      </p>

      <div className="mt">
        <button type="button" className="btn-primary" onClick={onBack}>
          내 결과로 돌아가기
        </button>
      </div>
    </section>
  );
}
