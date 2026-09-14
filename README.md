# ZINSIGHT (진사이트)

> **AI-powered B2B Enterprise Profiling & Hybrid Business Media Platform**  
> 관내 기업·기관 프로파일링 데이터베이스(**인사이트 레이더**)와 심층 비즈니스 저널리즘(**매거진**)을 통합 제공하는 데이터 인텔리전스 미디어 플랫폼입니다.

Next.js 15(App Router)와 Prisma ORM, MariaDB를 기반으로 구축되었으며, 지자체 관내 기업·기관 정보의 체계적인 수집·분석과 고도화된 매거진 CMS, 실시간 검색/방문자 애널리틱스를 제공합니다.

---

## 🚀 핵심 도메인 및 주요 기능

### 1. 📡 인사이트 레이더 (Insight Radar & Profiling)
- **지역(Region) 중심 관내 기업·기관 데이터베이스**:
  - 지자체(안양, 광명, 군포, 시흥, 의왕 등) 단위로 관내 기업, 공공기관, 테크 스타트업을 체계적으로 분류 및 아카이빙합니다.
- **실시간 뉴스 데이터 수집 엔진 (Naver News API)**:
  - 지역별 핵심 키워드 및 기업명 기반의 정밀 뉴스 자동 크롤링·수집 엔진을 탑재했습니다.
  - Canonical Link 기반의 완벽한 중복 방지 및 기사-조직 자동 매핑을 수행합니다.
- **기업·기관 프로필 허브**:
  - 사업 분야, 비즈니스 요약, 핵심 레퍼런스 및 관련 실시간 뉴스 기사를 통합 노출합니다.
- **통합 데이터 스냅샷 내보내기 (Export)**:
  - 특정 기간(월별) 및 지역별 조직·기사 데이터를 Excel(`.xlsx`) 스냅샷 형식으로 추출합니다.

---

### 2. 📰 ZINSIGHT 매거진 (Hybrid Media CMS)
- **이원화된 지면 발행 체계**:
  - **Core 테크 저널 (`/magazine/tech-marketing/*`)**: 주간 기술 트렌드 뉴스레터 및 SEO/GEO 기반 디지털 마케팅 분석 리포트
  - **로컬 비즈니스 허브 (`/magazine/local/[region]/*`)**: 지자체별 기업 스포트라이트, 지원사업·정책 브리핑, 산학협력·교육 기사
- **구조화된 텍스트 에디터 (Structured CMS)**:
  - 리드(Lead) - 본문 섹션(Body Sections) - 클로징(Closing)의 3단 구조화 에디터
  - 스마트 글머리 기호(Enter 연속 입력), 미세 단락 여백 제어, 마크다운 링크/이미지 서식 지원
  - 엔터 키 입력 시 실수로 저장/발행되는 현상을 원천 방지하는 폼 제출 안전장치 적용
- **시맨틱 이미지 시스템 v2.0**:
  - 에디터 내 대체 텍스트(`alt`)와 캡션(`figcaption`)의 분리 입력 및 기존 삽입 이미지 재편집 지원
  - 웹 접근성 기준(명도 대비 4.5:1 이상)을 충족하는 `<figure>`, `<img>`, `<figcaption>` 시맨틱 렌더링
  - Vercel Blob 업로드 시 영문 슬러그 파일명 자동 보존 및 중복 방지 접미사 처리
  - 스토리지 보관함에서 파일명 변경 시 기사 본문 및 썸네일 URL을 자동 일괄 치환하는 무결성 트랜잭션
- **파트너 콘텐츠 및 저자 시스템**:
  - 유료 기사 및 산학협력 대상 '파트너' / '협력 기관' 배지 노출
  - 진사이트 편집부 및 기명 필진별 프로필 페이지(`/magazine/authors/[slug]`) 자동 연동

---

### 3. 📊 엔터프라이즈 애널리틱스 (Analytics Dashboard)
- **GA4 Data API & Google Search Console(GSC) 실시간 연동**:
  - 기사별·조직별 조회수 추이, 검색 노출수, 클릭수, 평균 순위, CTR을 한눈에 파악합니다.
- **유입 채널 5단계 정밀 세분화 (F-08)**:
  - 🤖 **AI 서비스**: ChatGPT, Perplexity, Claude, Gemini 등 생성형 AI 답변 링크를 통한 유입 추적
  - 🔍 **검색엔진**: 구글, 네이버, 다음 등 자연 검색(Organic Search)
  - 📱 **SNS**: 인스타그램, 유튜브, 페이스북, X(트위터), 링크드인 등
  - 🔗 **직접 방문**: 북마크, URL 직접 입력, 앱 내 링크 직접 오픈
  - 💡 **기타**: 외부 웹사이트 링크(Referral/백링크), 뉴스레터 이메일, 광고 등
- **방문자 속성 분석**:
  - 디바이스(PC/모바일/태블릿), 시간대별 유입 분포, 신규 vs 재방문 비율 제공
- **클라이언트용 성과 리포트 출력**:
  - 광고주 및 협력 기관 보고를 위한 맞춤형 성과 요약 모달 및 인쇄/PDF 내보내기 지원

---

## 🛠 기술 스택

| 분류 | 기술 |
| :--- | :--- |
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript 5+](https://www.typescriptlang.org/) |
| **ORM** | [Prisma ORM 7+](https://www.prisma.io/) (`@prisma/adapter-mariadb`) |
| **Database** | MariaDB / MySQL |
| **File Storage** | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| **Styling & UI** | Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) (Radix UI), Lucide Icons |
| **Charts** | Recharts |
| **Data APIs** | Naver Search News API, Google Analytics Data API (GA4), Google Search Console API |
| **Excel Export** | SheetJS (`xlsx`) |

---

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── (public)/                 # 공개 프론트엔드 라우트
│   │   ├── page.tsx              # 홈 화면 (인사이트 레이더 + 매거진 캐러셀)
│   │   ├── insight-radar/        # 인사이트 레이더 관내 기업 목록 및 상세
│   │   ├── magazine/             # 매거진 허브 및 기사 상세 (테크/로컬)
│   │   └── authors/              # 필진/저자 프로필 지면
│   ├── admin/                    # 관리자 CMS
│   │   ├── page.tsx              # 관리자 대시보드
│   │   ├── magazine/             # 매거진 포스트 작성/편집/헤드라인 관리
│   │   ├── companies/            # 관내 기업·기관 관리 및 임포트
│   │   ├── keywords/             # 지역별 수집 키워드 관리
│   │   ├── articles/             # 수집된 뉴스 기사 관리
│   │   ├── storage/              # Vercel Blob 이미지 스토리지 관리 (파일명 변경/삭제)
│   │   └── export/               # 월간 통합 엑셀 스냅샷 내보내기
│   └── api/                      # 서버리스 API 엔드포인트
├── actions/                      # Server Actions (DB CRUD, 크롤링, 애널리틱스)
├── components/
│   ├── public/                   # 공개 페이지 UI 컴포넌트
│   ├── admin/                    # 관리자 전용 UI 컴포넌트
│   └── ui/                       # shadcn/ui 기반 공통 원자 컴포넌트
└── lib/                          # DB Client(Prisma), GA4/GSC Client, 유틸리티 함수
```

---

## 📦 환경 변수 설정 (.env)

프로젝트 실행을 위해 루트 디렉토리에 `.env` 파일을 생성하고 아래 항목들을 설정합니다:

```env
# Database (MariaDB / MySQL)
DATABASE_URL="mysql://username:password@host:port/database"

# Admin Auth
ADMIN_PASSCODE=your_admin_password

# Naver News Search API
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Google Analytics 4 & Search Console
GA4_PROPERTY_ID=your_ga4_property_id
GSC_SITE_URL=https://zinsight.co.kr
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 💻 시작하기

### 1. 패키지 설치
```bash
pnpm install
```

### 2. 데이터베이스 클라이언트 생성
```bash
pnpm prisma generate
```

### 3. 개발 서버 실행
```bash
pnpm dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 서비스를 확인합니다.

---

## 📝 라이선스
This project is proprietary software belonging to ZINDOK / ZINSIGHT.
