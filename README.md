# portfolio

장누가의 개인 포트폴리오. [Akshayp2002/next-portfolio-new](https://github.com/Akshayp2002/next-portfolio-new)(Next.js 16, App Router)를 기반으로 이식했으며, 콘텐츠(경력/학력/수상/프로젝트)는 **Notion 데이터베이스를 원본(source of truth)** 으로 두고 서버 사이드에서 실시간으로 조회해 렌더링한다.

## 아키텍처

- **Next.js 16 App Router**, TypeScript, Tailwind CSS v4 + styled-components
- 콘텐츠는 빌드 타임에 정적으로 굽지 않고, `about`/`projects` 페이지가 매 요청마다(`force-dynamic`) `lib/notion.ts`를 통해 Notion API를 직접 호출한다.
- `@notionhq/client`(v5) 호출 결과는 Next.js의 `unstable_cache`로 감싸 `NOTION_REVALIDATE_SECONDS`(기본 300초) 동안 재사용한다. 페이지 속성(제목/설명/태그 등)과 페이지 본문(이미지/문단 등 블록)을 각각 별도로 캐싱한다.
- 사이트에서 항목을 클릭하면 `/api/notion/[id]` 라우트가 온디맨드로 해당 Notion 페이지의 본문 블록을 가져와 모달에 렌더링한다(`src/app/components/NotionBlocks.tsx`).
- Notion이 내려주는 이미지 URL은 서명된(signed) URL로 **1시간**만 유효하다(Notion 공식 문서 기준). 캐시 주기(기본 5분)가 이보다 훨씬 짧기 때문에 별도로 이미지를 미러링하지 않고 매 재검증마다 새 URL을 받는 방식으로 설계했다.

## Notion 데이터 모델

단일 데이터베이스("포트폴리오")에 아래 속성을 사용한다.

| 속성 | 타입 | 설명 |
| --- | --- | --- |
| 이름 | title | 항목 제목 |
| 구분 | select | `Work` / `Education` / `Prize` / `Project` — 사이트의 어느 섹션에 표시될지 결정 |
| 카테고리 | multi-select | `구분`에 따라 의미가 달라지는 세부 태그(예: Work는 기술스택, Project는 서비스/쇼핑몰/홈페이지/개인프로젝트 분류) |
| 기간 | rich text | 자유 형식 기간 표기(예: `2019 - Now`, `2024`) |
| 설명 | rich text | 카드/미리보기에 노출되는 짧은 설명 |
| 링크 | url | 외부 링크 |
| 이미지 | files | 목록·카드의 썸네일(첫 번째 파일 사용) |
| 공개 | checkbox | **체크된 항목만 사이트에 노출**된다. 이게 사이트 표시 여부의 유일한 기준 |

**페이지 본문(블록)**: 위 속성과 별개로, 각 Notion 페이지 본문에 이미지/문단 등을 자유롭게 작성할 수 있다. 사이트에서 항목을 클릭하면 이 본문이 상세 모달에 그대로 렌더링된다(지원 블록: 문단/제목/글머리기호·번호 목록/인용/구분선/이미지). **콘텐츠를 갱신하려면 Notion 페이지를 직접 수정하면 된다** — 코드 배포 없이 캐시 주기(기본 5분) 안에 사이트에 반영된다.

## 로컬 실행

### 사전 준비

`.env.example`을 복사해 `.env`를 만들고 `NOTION_TOKEN`을 채운다.

```bash
cp .env.example .env
```

- `NOTION_TOKEN`: [notion.so/my-integrations](https://www.notion.so/my-integrations)에서 인테그레이션을 만들고, 대상 데이터베이스("포트폴리오")에 연결(Connect)해야 조회가 가능하다.
- `NOTION_DATABASE_ID`: 기본값이 이미 채워져 있다.
- `NOTION_REVALIDATE_SECONDS`: 캐시 주기(초). 기본 300.

### Docker Compose로 실행 (권장)

이 프로젝트의 모든 실행/배포는 Docker Compose로 통일되어 있다.

```bash
./compose.sh --dev up      # 개발 모드: 소스 바인드 마운트 + next dev 핫리로드, 파일 저장 즉시 반영
./compose.sh --dev down    # 개발 모드 정지

./compose.sh up            # 운영 모드: standalone 빌드. 코드 변경 후에는 반드시 재빌드 필요(down && up)
./compose.sh down          # 운영 모드 정지
```

- 포트는 1337을 우선 사용하고, 이미 사용 중이면 1338 → 1339 순으로 자동 조정한다(`PORT`/`DEV_PORT` 환경변수로 직접 지정도 가능).
- dev/prod는 서로 다른 Docker Compose 프로젝트(`portfolio-dev` / `portfolio-prod`)로 분리되어 있어 동시에 띄워도 네트워크·컨테이너가 섞이지 않는다.

### Docker 없이 실행

```bash
npm install
npm run dev
```

## 배포

- `Dockerfile`은 Next.js 공식 가이드에 따라 `output: 'standalone'` 멀티스테이지 빌드를 사용한다. 최종 이미지에는 `.next/standalone`, `.next/static`, `public`만 포함되고 non-root(`node`) 유저로 실행된다.
- `NOTION_TOKEN` 등 시크릿은 이미지 레이어에 굽지 않고 `.env`를 통해 **런타임에만** 주입한다.
- 운영 서버에서는 리버스 프록시(nginx)가 `portfolio.nugabox.com` → 이 컨테이너의 내부 포트로 라우팅한다고 가정한다. 이 레포 안에는 nginx 설정을 포함하지 않으며, 운영 서버의 기존 nginx가 컨테이너 포트(기본 1337)로 프록시하도록 별도 설정하면 된다.

## 프로젝트 구조

```
portfolio/
├── lib/notion.ts            # Notion API 클라이언트 + 데이터 조회/매핑
├── src/app/
│   ├── about/, projects/    # 서버 컴포넌트: getGroupedPortfolio()로 Notion 데이터 조회
│   ├── api/notion/[id]/     # 클릭 시 온디맨드 페이지 본문 조회 라우트
│   ├── components/          # NotionBlocks(본문 렌더러), ModalPortal 등 공용 컴포넌트
│   └── components/tiles/    # 홈 bento 그리드, about/projects 섹션별 UI
├── Dockerfile, Dockerfile.dev
├── docker-compose.yml, docker-compose.dev.yml
├── compose.sh
└── AGENTS.md                 # 버전관리/커밋/운영 규칙
```

## 개발 규칙

버전 관리, 커밋 컨벤션, Docker Compose 운영 원칙, Notion 원칙 등은 [AGENTS.md](AGENTS.md)를 참고.

## License

MIT
