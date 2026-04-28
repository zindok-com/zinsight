# zinsight 프로젝트 초기화 가이드 및 폴더 구조

## 🚀 zinsight 프로젝트 초기화 가이드

### 1단계: 신규 Next.js 프로젝트 생성
Next.js 15+ App Router를 기반으로 새로운 프로젝트를 생성합니다. (경로 Alias 설정 적용)
```bash
npx create-next-app@latest zinsight --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd zinsight
```

### 2단계: 필수 패키지 설치 및 Prisma 초기화
데이터베이스 및 UI 컴포넌트 등 필수 의존성을 설치합니다.
```bash
# Prisma 설치 및 초기화
npm install prisma @prisma/client
npx prisma init

# (필요시) 기존 사용하던 shadcn/ui 컴포넌트 라이브러리 초기화
npx shadcn@latest init
```

### 3단계: Shared Core 및 Admin 기능 마이그레이션
기존 `MICE Scout` 폴더에서 `zinsight` 폴더로 주요 자산을 복사합니다.

1. **DB 스키마 복사:** 기존 `prisma/schema.prisma`를 새 프로젝트의 `prisma/` 경로에 그대로 덮어씁니다.
2. **공통 모듈 복사:** 기존 `src/lib/` 디렉터리(db.ts, utils 등)를 복사합니다.
3. **서버 액션 복사:** 기존 `src/actions/` 디렉터리를 가져오되, 데이터 조회/수집 관련 로직을 유지합니다.
4. **관리자 페이지 이전:** 기존 `src/app/admin/` 폴더를 그대로 새 프로젝트의 `src/app/admin/`으로 이동시킵니다. 내부 컴포넌트 호출 경로는 `@/components/...` 형식이 유지되므로 큰 수정 없이 동작해야 합니다.

### 4단계: 퍼블릭(일반 유저) 구조 생성
요청하신 유저 대상의 Insight Radar 및 Magazine 페이지와 공통 컴포넌트 폴더를 구성합니다.

---

## 📂 zinsight 프로젝트 폴더 구조 (Directory Structure)

Route Groups(`(public)`)를 사용하여 URL 경로에 영향을 주지 않고 관리자와 유저의 레이아웃을 완벽하게 분리합니다.

```text
zinsight/
├── .env                  # 로컬 환경 변수 (git ignore)
├── .env.example          # 환경 변수 템플릿 파일
├── prisma/
│   └── schema.prisma     # [복사됨] 기존 MICE Scout DB 스키마 구조 유지
├── src/
│   ├── actions/          # Server Actions
│   │   ├── admin/        # 관리자 전용 권한이 필요한 쓰기/수정/삭제 액션
│   │   └── shared/       # [유지됨] 데이터 수집 및 공통 조회 액션
│   ├── app/
│   │   ├── (public)/     # [신규] 일반 유저용 라우트 그룹 (URL에는 노출 안 됨)
│   │   │   ├── insight-radar/  # [신규] 인사이트 레이더 페이지 (/insight-radar)
│   │   │   │   └── page.tsx
│   │   │   ├── magazine/       # [신규] 매거진 페이지 (/magazine)
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx      # 일반 유저 전용 공통 레이아웃 (GNB, Footer 적용)
│   │   ├── admin/        # [이전됨] 기존 관리자 페이지 (/admin/*)
│   │   │   ├── articles/
│   │   │   ├── companies/
│   │   │   ├── export/
│   │   │   ├── industries/
│   │   │   ├── keywords/
│   │   │   └── layout.tsx      # 관리자 전용 레이아웃 (Admin Sidebar 등 적용)
│   │   ├── api/          # 통합 API 엔드포인트
│   │   ├── globals.css
│   │   └── layout.tsx    # 최상위 Root Layout (메타데이터 및 글로벌 Provider)
│   ├── components/
│   │   ├── admin/        # 관리자 전용 UI 컴포넌트
│   │   ├── public/       # 일반 유저 전용 UI 컴포넌트
│   │   ├── shared/       # [신규] 관리자-유저 공용 컴포넌트 (버튼, 카드, 데이터 테이블 등)
│   │   └── ui/           # shadcn/ui 등 원시(Raw) UI 컴포넌트
│   └── lib/              # [유지됨] DB 클라이언트 및 유틸리티
│       ├── db.ts         # Prisma 클라이언트 설정 파일
│       └── utils.ts
└── package.json
```
