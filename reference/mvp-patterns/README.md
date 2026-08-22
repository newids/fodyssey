# 금융 코디세이 MVP

> 스코프: `docs/idea-1/_archive/MVP_스코프_v0.1.md` | 데모 대본: `docs/idea-1/_archive/데모_시나리오_v0.1.md`

## 구조

```
mvp/
├── data/
│   ├── raw/                       # 공공데이터 원본 (설계·근거용)
│   │   └── 경찰청_전화금융사기_피해자_연령별_현황_2016-2025.csv
│   └── scam_dataset_v0.1.json     # 사기문자 판별 데이터셋 (사기 30 + 정상 10)
├── prototype/
│   ├── adaptive_system_prompt.md  # 적응형 시스템 프롬프트 템플릿
│   ├── profiles.json              # 데모 페르소나 2종 (senior / youth)
│   ├── run_compare.py             # 동일 입력 → 프로파일별 출력 비교 스크립트
│   └── golden/                    # 기대 출력 기준 문안 (S01)
└── web/                           # 실습 교육용 웹 (React+Vite, 완전 정적)
    └── src/
        ├── lib/                   # 순수 로직 — 프로파일·세션 구성·취약도 지수·회차 이력
        └── components/            # 화면 — 온보딩·수칙·퀴즈·해설·결과·기관 리포트
```

## 웹 실습 시스템 (`mvp/web`)

```bash
cd mvp/web && npm install
npm test        # vitest (순수 로직 + 정적 렌더 스모크)
npm run build   # dist/ 생성, JS 번들 gzip 크기 확인
npm run dev     # 로컬 확인
```

- 배포: https://newids.github.io/codyssey-e2-1/app/ (`vite.config.js`의 `base` 경로 유지 필수)
- 훈련 루프 5단계 구현: 대응 수칙(`lib/rules.js`) → 진단·집중 노출(`lib/quiz.js`) → 실패 해부(`lib/adaptive.js`) → 재측정(`lib/vulnerability.js`, `lib/history.js`)
- 런타임 LLM·서버 호출 없음. 상태는 localStorage(`lib/storage.js`)에만 남는다.
- 기관 리포트 미리보기는 **합성 데이터 전용 모듈**(`lib/cohortDemo.js`)에서만 값을 받으며, 화면에 `예시 데이터(합성)` 배지를 항상 노출한다.

## 프로토타입 실행 (W1 검증)

```bash
export ANTHROPIC_API_KEY=<키>
cd mvp/prototype
python3 run_compare.py --item S01 --save   # 결과가 outputs/에 저장됨
```

- 모델 출력이 `golden/S01_*.md`의 구조·톤(안심 문장 시작, 3단계, 전문용어 금지 / 카드 1장, 결론 먼저)에 수렴하는지 확인.
- 다른 문항으로도 비교 가능: `--item S19` (지인사칭), `--item L04` (정상 — 오탐 검증).

## 데이터셋 원칙

- 보이스피싱지킴이(금감원·경찰청) 공개 사례의 **수법 패턴만 추출해 전면 재작성**. 원문 전재 없음.
- 전화번호·URL은 전부 가상(0000 계열, `*.example`). 실서비스 반영 전 가상 표기 유지 검수 필수.
- 비중: 기관사칭 12(40%) — 기관사칭형이 전체 피해의 51%(경찰청, 2025) 반영.
- 정상 문항 10개 포함 — 판별 퀴즈의 보기 구성과 오탐(정상을 사기로 판정) 검증에 필요.
- `lure` 필드(권위·공포·이득·긴급·친밀): 취약도 지수의 분모·분자를 가르는 축. **AI가 붙이지 않고 사람이 검수해 고정한 메타데이터**이며, 기본 매핑에서 출발해 문항별로 개별 지정했다(정상 문항은 `null`). 구성: 이득 8 · 공포 6 · 친밀 6 · 권위 5 · 긴급 5.

## 남은 수동 작업 (사용자 액션)

1. **data.go.kr API 활용신청** (자동승인, ~30분):
   회원가입 → [대한민국 공공서비스(혜택) 정보](https://www.data.go.kr/data/15113968/openapi.do) → 활용신청 → 마이페이지에서 인증키 확인
2. **NIA 디지털정보격차 XLSX 수동 다운로드** (자동 수집은 봇 차단으로 중단):
   브라우저에서 https://www.data.go.kr/data/15038422/fileData.do → [다운로드] → `mvp/data/raw/`에 저장
   ⚠️ 제2유형 라이선스(출처표시·비상업) — 설계 참고용으로만 사용
