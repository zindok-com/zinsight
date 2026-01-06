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

### 2. 설치
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