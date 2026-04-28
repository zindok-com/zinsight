# 🎨 Design Reference

이 폴더는 zinsight 프로젝트의 **UI/UX 디자인 레퍼런스 전용** 공간입니다.
작업 중인 디자인 파일, 가이드라인, 코드 스니펫을 이곳에 업로드하면
AI Agent가 이를 참고하여 개발에 반영합니다.

---

## 📂 권장 폴더 구조

```
_design-reference/
├── README.md               ← 이 파일
│
├── guidelines/             ← 디자인 시스템 가이드 (텍스트/마크다운)
│   ├── colors.md           예) 컬러 팔레트, CSS 변수 정의
│   ├── typography.md       예) 폰트, 크기, 행간 규칙
│   ├── spacing.md          예) 여백, 그리드 시스템
│   └── components.md       예) 버튼, 카드, 인풋 등 컴포넌트 규칙
│
├── tokens/                 ← 디자인 토큰 파일 (JSON, CSS, JS 등)
│   ├── design-tokens.json  예) Figma Variables export
│   └── theme.css           예) CSS 변수 직접 정의
│
├── screenshots/            ← 참고할 UI 스크린샷 또는 목업 이미지
│   ├── hero-section.png
│   ├── card-layout.png
│   └── ...
│
└── snippets/               ← 참고할 코드 스니펫 (TSX, CSS 등)
    ├── example-card.tsx
    ├── globals.css
    └── ...
```

---

## 📌 업로드 방법

1. 위 폴더 구조를 참고하여 파일을 해당 위치에 넣어주세요.
2. 어떤 파일을 올렸는지 AI Agent에게 알려주세요.
   - 예: _"_design-reference/guidelines/colors.md 올렸어. 이 컬러 시스템 반영해줘."_
3. Agent가 파일을 읽고 개발에 즉시 반영합니다.

---

## ⚠️ 주의사항

- 이 폴더는 **빌드 대상에서 제외**됩니다. (Next.js가 `_`로 시작하는 폴더를 무시)
- 실제 소스코드(`src/`)에는 영향을 주지 않습니다.
- 이미지는 `.png`, `.jpg`, `.webp`, `.svg` 모두 가능합니다.
