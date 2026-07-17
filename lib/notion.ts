import { Client } from "@notionhq/client";
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client";
import { unstable_cache } from "next/cache";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const REVALIDATE_SECONDS = Number(process.env.NOTION_REVALIDATE_SECONDS ?? 300);

export type PortfolioCategory = "Work" | "Education" | "Prize" | "Project";

export type PortfolioItem = {
  id: string;
  title: string;
  category: PortfolioCategory;
  tags: string[];
  period?: string;
  description?: string;
  link?: string;
  imageUrls: string[];
};

export type GroupedPortfolio = Record<PortfolioCategory, PortfolioItem[]>;

function getClient(): Client {
  if (!NOTION_TOKEN) {
    throw new Error(
      "NOTION_TOKEN 환경변수가 설정되지 않았습니다. .env에 채워주세요."
    );
  }
  return new Client({ auth: NOTION_TOKEN, notionVersion: "2025-09-03" });
}

let cachedDataSourceId: string | null = null;

async function getDataSourceId(notion: Client): Promise<string> {
  if (cachedDataSourceId) return cachedDataSourceId;
  if (!NOTION_DATABASE_ID) {
    throw new Error("NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.");
  }

  const database = await notion.databases.retrieve({
    database_id: NOTION_DATABASE_ID,
  });
  const dataSourceId = ("data_sources" in database
    ? database.data_sources[0]?.id
    : undefined) as string | undefined;

  if (!dataSourceId) {
    throw new Error(
      `Notion 데이터베이스(${NOTION_DATABASE_ID})에서 데이터소스를 찾을 수 없습니다.`
    );
  }

  cachedDataSourceId = dataSourceId;
  return dataSourceId;
}

function plainText(richText: RichTextItemResponse[] | undefined): string {
  if (!richText) return "";
  return richText.map((t) => t.plain_text).join("");
}

function mapPage(page: PageObjectResponse): PortfolioItem {
  const props = page.properties;

  const titleProp = props["이름"];
  const title =
    titleProp?.type === "title" ? plainText(titleProp.title) : "";

  const categoryProp = props["구분"];
  const category = (
    categoryProp?.type === "select" ? categoryProp.select?.name : undefined
  ) as PortfolioCategory;

  const tagsProp = props["카테고리"];
  const tags =
    tagsProp?.type === "multi_select"
      ? tagsProp.multi_select.map((t) => t.name)
      : [];

  const periodProp = props["기간"];
  const period =
    periodProp?.type === "rich_text"
      ? plainText(periodProp.rich_text) || undefined
      : undefined;

  const descriptionProp = props["설명"];
  const description =
    descriptionProp?.type === "rich_text"
      ? plainText(descriptionProp.rich_text) || undefined
      : undefined;

  const linkProp = props["링크"];
  const link = linkProp?.type === "url" ? linkProp.url ?? undefined : undefined;

  const imagesProp = props["이미지"];
  const imageUrls =
    imagesProp?.type === "files"
      ? imagesProp.files.map((f) =>
          f.type === "external" ? f.external.url : f.file.url
        )
      : [];

  return { id: page.id, title, category, tags, period, description, link, imageUrls };
}

async function fetchPublishedPortfolioItems(): Promise<PortfolioItem[]> {
  const notion = getClient();
  const dataSourceId = await getDataSourceId(notion);

  const items: PortfolioItem[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      filter: {
        property: "공개",
        checkbox: { equals: true },
      },
    });

    for (const page of response.results) {
      if (page.object === "page" && "properties" in page) {
        items.push(mapPage(page));
      }
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return items;
}

// Notion API는 fetch가 아닌 SDK 호출이라 Next.js의 fetch 캐시 대상이 아니므로,
// unstable_cache로 감싸 revalidate 주기(NOTION_REVALIDATE_SECONDS, 기본 300초) 동안 재사용한다.
export const getPortfolioItems = unstable_cache(
  fetchPublishedPortfolioItems,
  ["notion-portfolio-items"],
  { tags: ["portfolio"], revalidate: REVALIDATE_SECONDS }
);

export async function getGroupedPortfolio(): Promise<GroupedPortfolio> {
  const items = await getPortfolioItems();
  return {
    Work: items.filter((item) => item.category === "Work"),
    Education: items.filter((item) => item.category === "Education"),
    Prize: items.filter((item) => item.category === "Prize"),
    Project: items.filter((item) => item.category === "Project"),
  };
}

// ---- 페이지 본문(blocks) ----
// 사이트에서 항목을 클릭해 들어갔을 때 보여줄 상세 콘텐츠. 지원하는
// 블록 타입만 추려서 렌더링하기 쉬운 구조로 변환한다.

export type PortfolioBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading_2"; text: string }
  | { type: "heading_3"; text: string }
  | { type: "bulleted_list_item"; text: string }
  | { type: "numbered_list_item"; text: string }
  | { type: "quote"; text: string }
  | { type: "divider" }
  | { type: "image"; url: string; caption?: string };

async function fetchPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
  const notion = getClient();
  const blocks: BlockObjectResponse[] = [];
  let cursor: string | undefined;

  do {
    const response = await notion.blocks.children.list({
      block_id: pageId,
      start_cursor: cursor,
      page_size: 100,
    });

    for (const block of response.results) {
      if ("type" in block) blocks.push(block);
    }

    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);

  return blocks;
}

function mapBlock(block: BlockObjectResponse): PortfolioBlock | null {
  switch (block.type) {
    case "paragraph": {
      const text = plainText(block.paragraph.rich_text);
      return text ? { type: "paragraph", text } : null;
    }
    case "heading_2":
      return { type: "heading_2", text: plainText(block.heading_2.rich_text) };
    case "heading_3":
      return { type: "heading_3", text: plainText(block.heading_3.rich_text) };
    case "bulleted_list_item":
      return { type: "bulleted_list_item", text: plainText(block.bulleted_list_item.rich_text) };
    case "numbered_list_item":
      return { type: "numbered_list_item", text: plainText(block.numbered_list_item.rich_text) };
    case "quote":
      return { type: "quote", text: plainText(block.quote.rich_text) };
    case "divider":
      return { type: "divider" };
    case "image": {
      const img = block.image;
      const url = img.type === "external" ? img.external.url : img.file.url;
      const caption = plainText(img.caption);
      return { type: "image", url, caption: caption || undefined };
    }
    default:
      return null;
  }
}

async function fetchPortfolioItemContent(pageId: string): Promise<PortfolioBlock[]> {
  const blocks = await fetchPageBlocks(pageId);
  return blocks
    .map(mapBlock)
    .filter((block): block is PortfolioBlock => block !== null);
}

// Notion이 서명(만료)된 파일 URL을 내려주지만, revalidate 주기(기본 5분)가
// URL 유효기간(~1시간)보다 훨씬 짧아 매 재검증마다 새 URL을 받으므로 별도로
// 이미지를 미러링하지 않는다.
export const getPortfolioItemContent = unstable_cache(
  fetchPortfolioItemContent,
  ["notion-portfolio-item-content"],
  { tags: ["portfolio"], revalidate: REVALIDATE_SECONDS }
);
