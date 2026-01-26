# MICE Scout (Next.js Refactor)

**MICE Scout**은 전시회 오거나이저를 위해 참가 유망 기업을 발굴하고 관리하는 **데이터 인텔리전스 대시보드**입니다.
기존 백엔드 도구를 **Next.js (App Router)** 기반의 모던 웹 애플리케이션으로 리팩토링하여, 직관적인 UI와 효율적인 데이터 관리 흐름을 제공합니다.

## 🚀 주요 기능

### 1. 📊 대시보드 (Dashboard)
- 전체 기업 수, 검토 필요 항목, 확정된 기업 수, 수집된 기사 수 등 주요 지표를 한눈에 확인합니다.
- 최근 시스템 로그를 통해 활동 내역을 모니터링합니다.

### 2. 📥 데이터 가져오기 (Import)
- CSV, Excel, JSON 파일을 **Drag & Drop**으로 간편하게 업로드합니다.
- 업로드된 데이터를 미리보기(Preview)하고, 시스템에 병합(Upsert)할 수 있습니다.

### 3. 🏢 기업 관리 (Entities)
- **고급 데이터 테이블**: 필터링, 정렬, 검색 기능을 제공합니다.
- **상세 검토 (Detail Drawer)**: 기업을 클릭하여 상세 정보를 확인하고, '승인(Confirm)' 또는 '반려(Reject)' 처리할 수 있습니다.
- 검토 상태(Auto Confirmed, Needs Review 등)에 따라 체계적인 관리가 가능합니다.

### 4. 📰 뉴스 기사 (Articles) - **NEW!**
#### 2단계 구조로 개선
- **배치 목록**: 수집된 뉴스를 배치(수집 시각 + 검색어)별로 그룹화하여 표시
- **아티클 목록**: 특정 배치를 클릭하면 해당 배치의 30개 아티클을 테이블로 확인
- **상세 보기**: 아티클을 클릭하면 Drawer에서 전체 내용, 원문 링크, Raw JSON 확인 가능
- **뉴스 수집**: "뉴스 수집" 버튼으로 Naver News API를 통해 최신 뉴스 자동 수집

#### 사용 방법
1. **Articles 메뉴** 클릭 → 수집된 배치 목록 확인
2. **배치 선택** → 해당 배치의 30개 아티클 표시
3. **아티클 선택** → 상세 정보 및 원문 확인
4. **뉴스 수집** → 최신 뉴스 자동 수집 (검색어당 30개씩)

### 5. 🗂 데이터 탐색기 (Data Explorer)
- 서버의 `/data` 디렉토리 내 파일(Raw, Parsed, Exports, Logs)을 직접 탐색합니다.
- 파일을 클릭하여 브라우저에서 바로 **다운로드**할 수 있습니다.

### 6. 📤 내보내기 (Export)
- 검토가 완료된 데이터를 필터링하여 **Excel (.xlsx)** 또는 **CSV** 형식으로 다운로드합니다.

---

## 🛠 기술 스택

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Data Management**: Server Actions, File-based JSON Persistence (NoSQL-like)
- **File Processing**: SheetJS (xlsx), PapaParse
- **Table**: TanStack Table
- **External API**: Naver News Search API

---

## 📦 설치 및 실행 방법

### 1. 사전 요구사항
- Node.js (v18.17 이상 권장)
- npm
- Naver News API 키 (뉴스 수집 기능 사용 시)

### 2. 설치
프로젝트 루트에서 의존성을 설치합니다.
```bash
npm install
```

### 3. 환경 변수 설정 (.env)
루트 디렉토리에 `.env` 파일을 생성합니다.
```env
# 관리자 로그인 패스코드
ADMIN_PASSCODE=admin1234

# Naver News API 인증 정보 (뉴스 수집 기능 필요 시)
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 4. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 5. 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```

---

## 🔐 초기 로그인
- 초기 접속 시 로그인 화면이 표시됩니다.
- 설정된 **Passcode** (`admin1234`)를 입력하여 대시보드에 접근하세요.

---

## 📘 사용 가이드

### 뉴스 수집 워크플로우
1. **Articles 페이지** 접속
2. **"뉴스 수집"** 버튼 클릭
3. 수집 완료 후 새로운 배치가 목록 상단에 추가됨
4. 배치를 클릭하여 수집된 30개 아티클 확인
5. 향후 Processor 구현 시 이 아티클들에서 자동으로 기업 정보 추출

### 기업 검토 워크플로우
1. **Entities 페이지** 접속
2. 테이블에서 검토할 기업 클릭
3. Drawer에서 상세 정보 확인
4. **Confirm** (승인) 또는 **Reject** (반려) 선택
5. 필요 시 Notes에 메모 작성
6. 변경사항 자동 저장

### 데이터 내보내기
1. **Export 페이지** 접속
2. 필터 옵션 선택 (상태, 점수 등)
3. 파일 형식 선택 (Excel/CSV)
4. **Generate Export** 클릭
5. 생성된 파일 다운로드

---

## 📂 프로젝트 구조

```
src/
├── app/                 # Next.js App Router 페이지 및 API 라우트
│   ├── articles/        # 뉴스 배치 및 아티클 페이지
│   │   └── [batchId]/   # 동적 배치 상세 페이지
│   ├── entities/        # 기업 관리 페이지
│   ├── api/             # 파일 다운로드, 인증 등 API
│   └── login/           # 로그인 페이지
├── actions/             # Server Actions (비즈니스 로직)
│   ├── news-actions.ts  # 뉴스 수집 로직
│   └── entity-actions.ts
├── components/          # UI 컴포넌트
│   ├── ui/              # shadcn/ui 재사용 컴포넌트
│   ├── articles/        # 배치/아티클 테이블 및 Drawer
│   ├── entities/        # 기업 관리 관련 컴포넌트
│   └── ...
├── lib/                 # 유틸리티 함수
│   └── batch-utils.ts   # 배치 그룹화 로직
├── services/            # 데이터 처리 서비스
│   └── data-service.ts  # 파일 시스템 기반 데이터 관리
├── types/               # TypeScript 타입 정의
└── legacy/              # 레거시 코드 (참고용)
```

---

## 📝 최근 변경사항 (2026-01-26)

### Articles 페이지 2단계 구조 구현
- ✅ 배치 목록 → 아티클 목록의 계층 구조
- ✅ 수집 시각과 검색어로 배치 자동 그룹화
- ✅ Base64 인코딩 기반 배치 ID 생성
- ✅ 테이블 정렬, 필터링, 페이지네이션
- ✅ Drawer를 통한 아티클 상세 보기

### 뉴스 수집 로직 개선
- ✅ 중복 제거 로직 제거 (매번 30개 전체 수집)
- ✅ Raw 데이터 자동 저장 (`/data/raw`)
- ✅ 수집 결과 토스트 알림

---

## 🔮 향후 계획

### Processor 구현 (우선순위 1)
레거시 `processor.ts`의 핵심 로직 포팅 또는 LLM 기반 구현:
- 뉴스 기사에서 기업명 자동 추출
- Signals 분석 (신제품 출시, 제조/인증, 조달 등)
- 카테고리 자동 분류
- 전시회 적합도 점수 계산

### 트렌드 분석 (우선순위 2)
- 키워드 빈도 분석
- 기술 트렌드 요약 생성

---

## 📝 라이선스
This project is proprietary software.
