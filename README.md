# MICE Scout (PoC)

**MICE Scout**은 전시회 오거나이저를 위해 참가 유망 기업을 발굴하는 **데이터 수집·가공 에이전트**입니다.
네이버 뉴스 API를 활용하여 'LED' 관련 중소/강소/벤처기업의 기사를 수집하고, 기업 정보를 구조화하여 유망 기업 리스트를 생성합니다.

## 🚀 프로젝트 목표
- **자동 수집**: 네이버 뉴스 API를 통해 기업 규모별(중소, 강소, 벤처) 키워드로 기사 수집
- **정보 추출**: 기사 텍스트에서 기업명, 규모, 주요 기술, 성과 등을 추출 및 정규화
- **리스트 생성**: 오거나이저에게 전달 가능한 형태의 '참가 유망 기업 리스트' 샘플 제공
- **트렌드 분석**: 수집된 데이터를 바탕으로 주요 기술 트렌드 요약

## 🛠 기술 스택
- **Language**: Node.js, TypeScript
- **Framework**: Express (웹 대시보드)
- **Library**: Axios (API 요청)
- **External API**: Naver Search API (News)

## 📦 설치 및 실행 방법

### 1. 사전 요구사항
* Node.js (v18 이상 권장)
* npm

### 2. 환경변수 설정
프로젝트 루트에 `.env` 파일을 생성하고 네이버 API 키를 입력합니다.
`env.example` 파일을 참고하세요.
```bash
cp .env.example .env
# .env 파일 편집
```

### 3. 설치
프로젝트 루트에서 의존성을 설치합니다.
```bash
npm install
```

### 3. 실행 모드

#### A. 웹 대시보드 모드 (권장)
데이터 수집 결과를 웹 인터페이스에서 시각적으로 확인할 수 있습니다.
```bash
npx ts-node src/server.ts
```
* 접속 주소: **http://localhost:3000**
* 기능: 기업 리스트 조회, 트렌드 요약, 데이터 새로고침

#### B. 콘솔(터미널) 모드
데이터 수집 및 가공 과정을 터미널 로그로 상세히 확인하고 싶을 때 사용합니다.
```bash
npx ts-node src/index.ts
```

## 📂 프로젝트 구조
* `src/collector.ts`: 네이버 뉴스 API 수집 모듈
* `src/processor.ts`: 데이터 추출 및 정규화 로직 (NLP 전처리)
* `src/store.ts`: 인메모리 데이터 저장소
* `src/server.ts`: 웹 서버 및 API 엔드포인트
* `public/index.html`: 웹 대시보드 UI

## 📋 데이터 검수 및 Export (검수 루프)

추출된 데이터를 CSV로 내려받아 엑셀에서 검수하고, 승인/거절 결과를 시스템에 다시 반영할 수 있습니다.

### 1. CSV Export (내보내기)
전체 엔티티 리스트를 CSV 파일로 다운로드합니다.
* **URL**: `http://localhost:3000/exports/entities.csv`
* **필터 옵션** (Query Params):
    * `review_status`: `NEEDS_REVIEW` | `HUMAN_CONFIRMED` | `REJECTED` ...
    * `company_scale`: `SME` | `LARGE` ...
    * `exhibition_participation_type`: `PRODUCT_LAUNCH` | `MANUFACTURING_READY` ...
* **예시**:
  ```
  http://localhost:3000/exports/entities.csv?review_status=NEEDS_REVIEW
  ```

### 2. 검수 수행 (Excel)
다운로드한 CSV 파일에서 다음 컬럼을 수정합니다.
1. `review_status`: `HUMAN_CONFIRMED` (승인) 또는 `REJECTED` (탈락) 등으로 변경
2. `review_notes`: 검토 의견 작성
3. `reviewed_by`: 검토자 이름 (선택)

### 3. CSV Import (반영하기)
수정된 CSV 파일을 업로드하여 검수 결과를 반영합니다.
* **URL**: `POST http://localhost:3000/imports/entity-reviews`
* **Body**: `multipart/form-data`, key=`file`
* **Curl 예시**:
  ```bash
  curl -X POST -F "file=@reviewed_data.csv" http://localhost:3000/imports/entity-reviews
  ```
