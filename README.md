# MICE Scout (Next.js Refactor)

**MICE Scout**은 전시회 오거나이저를 위해 참가 유망 기업을 발굴하고 관리하는 **데이터 인텔리전스 대시보드**입니다.
기존 백엔드 도구를 **Next.js (App Router)** 기반의 모던 웹 애플리케이션으로 리팩토링하여, 직관적인 UI와 효율적인 데이터 관리 흐름을 제공합니다.

## 🚀 주요 기능

### 1. 📊 대시보드 (Dashboard)
- 전체 기업 수, 검토 필요 항목, 확정된 기업 수, 수집된 기사 수 등 주요 지표를 한눈에 확인합니다.
- 최근 시스템 로그를 통해 활동 내역을 모니터링합니다.

### 2. � 데이터 가져오기 (Import)
- CSV, Excel, JSON 파일을 **Drag & Drop**으로 간편하게 업로드합니다.
- 업로드된 데이터를 미리보기(Preview)하고, 시스템에 병합(Upsert)할 수 있습니다.

### 3. 🏢 기업 관리 (Entities)
- **고급 데이터 테이블**: 필터링, 정렬, 검색 기능을 제공합니다.
- **상세 검토 (Detail Drawer)**: 기업을 클릭하여 상세 정보를 확인하고, '승인(Confirm)' 또는 '반려(Reject)' 처리할 수 있습니다.
- 검토 상태(Auto Confirmed, Needs Review 등)에 따라 체계적인 관리가 가능합니다.

### 4. 📰 뉴스 기사 (Articles)
- 수집된 기업 관련 뉴스 기사를 리스트 형태로 조회합니다.
- **Raw JSON 보기**: 수집된 원본 데이터를 다이얼로그에서 직접 확인하여 데이터 정확성을 검증할 수 있습니다.

### 5. � 데이터 탐색기 (Data Explorer)
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

---

## 📦 설치 및 실행 방법

### 1. 사전 요구사항
- Node.js (v18.17 이상 권장)
- npm

### 2. 설치
프로젝트 루트에서 의존성을 설치합니다.
```bash
npm install
```

### 3. 환경 변수 설정 (.env)
루트 디렉토리에 `.env` 파일이 있는지 확인하거나 새로 생성합니다.
```env
# 관리자 로그인 패스코드 (기본값: admin1234)
ADMIN_PASSCODE=admin1234
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

## 📂 프로젝트 구조

```
src/
├── app/                 # Next.js App Router 페이지 및 API 라우트
│   ├── (dashboard)/     # 대시보드 및 주요 기능 페이지
│   ├── api/             # 파일 다운로드, 인증 등 API
│   └── login/           # 로그인 페이지
├── actions/             # Server Actions (비즈니스 로직)
├── components/          # UI 컴포넌트
│   ├── ui/              # shadcn/ui 재사용 컴포넌트
│   ├── entities/        # 기업 관리 관련 컴포넌트
│   └── ...
├── lib/                 # 유틸리티 함수
├── services/            # 데이터 처리 서비스 (파일 시스템 접근)
└── types/               # TypeScript 타입 정의
```

## 📝 라이선스
This project is proprietary software.
