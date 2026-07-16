# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Content

- Craft(craft.me) 포트폴리오 내보내기(`./craft`)를 분석해 Notion DB("포트폴리오", `39faac4e32a580aa9f7fd2fd2a197b85`)로 1차 이관.
  - 데이터소스 스키마 확장: `공개`(checkbox), `설명`(rich text), `기간`(rich text), `링크`(url), `이미지`(files) 속성 추가.
  - `카테고리`(다중 선택) 태그 20종 등록 (Work: 기술스택 9종 / Education: 학위·자격증·논문 3종 / Prize: 분야 4종 / Project: craft 원문 소분류 4종).
  - 총 48건 등록 및 `공개=true`로 설정 — Work 1, Education 13(학위 3·자격증 9·석사논문 1), Prize 6, Project 28(서비스및솔루션 8·쇼핑몰 3·홈페이지 9·개인프로젝트 8).
  - 등록 후 `구분`별 개수를 재조회하여 검증 완료(Work 1 / Education 13 / Prize 6 / Project 28, 전건 공개).
  - 이미지(`craft/*.assets` 94개)는 로컬 파일이라 Notion MCP 첨부 도구(공개 HTTPS URL만 지원)로 자동 업로드가 불가능하여 미첨부 — 각 페이지에 수동 첨부 필요.
