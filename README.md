# zinsight (Insight Radar & Magazine)

**zinsight**는 산업별 인사이트를 발굴하고 기업 동향을 분석하는 **데이터 인텔리전스 플랫폼**입니다.
Next.js (App Router)와 Prisma ORM을 기반으로 리팩토링되어, 안정적인 데이터 관리와 직관적인 인사이트 레이더(Insight Radar) 및 매거진 서비스를 제공합니다.

## 🚀 주요 기능

### 1. 📊 대시보드 (Admin Dashboard)
- 산업별 현황, 키워드 수, 총 수집 기사 수 및 당월 신규 기사 수 등 주요 지표를 한눈에 확인합니다.
- 시스템 전체 운영 현황을 직관적인 카드로 제공합니다.

### 2. 🏢 조직 관리 (Organizations) - **Improved!**
- **통합 관리**: 기업(Company), 기관(Institution), 센터(Center) 등 다양한 엔티티 타입을 지원합니다.
- **레이더 리포트 임포트**: `Insight Radar` 결과(JSON)를 업로드하여 조직 정보와 관련 뉴스 기사를 한 번에 시스템에 등록합니다.
- **상세 내역 확인**: 각 조직과 연결된 뉴스 기사 및 비즈니스 요약 정보를 관리합니다.

### 3. 🏭 산업 및 키워드 관리 (Industries & Keywords) - **NEW!**
- **산업 관리**: 뉴스 수집의 대상이 되는 산업군을 생성하고 관리합니다.
- **키워드 관리**: 각 산업별로 특화된 검색 키워드를 설정하여 정밀한 데이터 수집이 가능합니다.
- **유연한 구성**: 산업별 활성화 상태 및 키워드별 가중치 설정을 지원합니다.

### 4. 📰 뉴스 기사 수집 (Articles)
- **산업별 수집**: 특정 산업을 선택하고 등록된 키워드들을 기반으로 Naver News API를 통해 최신 뉴스를 자동 수집합니다.
- **중복 방지**: Canonical Link 기반의 중복 체크 로직으로 데이터 무결성을 유지합니다.
- **매핑 자동화**: 수집된 기사는 해당 산업 및 키워드와 자동으로 연결됩니다.

### 5. 📤 스냅샷 내보내기 (Consolidated Export) - **Improved!**
- **멀티 산업 선택**: 여러 산업을 동시에 선택하여 통합 데이터를 추출할 수 있습니다.
- **월간 스냅샷**: 특정 기간(월별)을 기준으로 데이터를 필터링하여 Excel (.xlsx) 형식으로 내보냅니다.
- **데이터 분석 활용**: 수집된 조직 정보와 뉴스 링크가 포함된 정제된 엑셀 파일을 제공합니다.

---

## 🛠 기술 스택

- **Framework**: [Next.js 15+ (App Router)](https://nextjs.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: MySQL (PlanetScale or Local MySQL)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS
- **Data Management**: Server Actions & Prisma Client
- **File Processing**: SheetJS (xlsx) for Export
- **External API**: Naver News Search API

---

## 📦 설치 및 실행 방법

### 1. 사전 요구사항
- Node.js (v18.17 이상 권장)
- MySQL Database
- Naver News API 키

### 2. 설치
```bash
pnpm install
```

### 3. 데이터베이스 설정
1. `.env` 파일에 데이터베이스 연결 정보를 설정합니다.
2. Prisma schema를 적용합니다.
```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. 환경 변수 설정 (.env)
```env
# Database
DATABASE_URL="mysql://user:password@host:port/database"

# Admin Auth
ADMIN_PASSCODE=admin1234

# Naver News API
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### 5. 개발 서버 실행
```bash
pnpm dev
```

---

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── admin/           # 관리자 전용 페이지 (Dashboard, Industries, etc.)
│   │   ├── industries/  # 산업 관리
│   │   ├── keywords/    # 키워드 관리
│   │   ├── articles/    # 뉴스 수집 및 조회
│   │   ├── companies/   # 조직 관리 및 임포트
│   │   └── export/      # 데이터 내보내기
│   ├── api/             # 공통 API 엔드포인트
│   └── login/           # 관리자 로그인
├── actions/             # Server Actions (DB CRUD 및 외부 API 통신)
├── components/          # UI 및 기능별 공유 컴포넌트
├── lib/                 # DB Client, Utils 등
└── types/               # TypeScript 인터페이스 정의
```

---

## 📝 최근 변경사항 (2026-04-28)

### 데이터 아키텍처 혁신
- ✅ JSON 파일 기반 저장소에서 **MySQL + Prisma** 기반의 관계형 데이터베이스로 전환
- ✅ 데이터 무결성 및 관계(Industry - Keyword - Article - Company) 정의

### 관리 기능 강화
- ✅ **산업(Industry)** 및 **키워드(Keyword)** 관리 UI 구현
- ✅ **Entity Type** 도입을 통한 조직 분류 체계 고도화 (기업, 기관, 센터 등)
- ✅ **Insight Radar** 결과물 통합 임포트 기능 추가

### 리포트 기능 개선
- ✅ 다중 산업 선택 기반의 **통합 엑셀 내보내기** 기능 구현
- ✅ 월별 스냅샷 생성 로직 최적화

---

## 📝 라이선스
This project is proprietary software.
