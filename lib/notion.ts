import { Client } from "@notionhq/client";
import type { PageObjectResponse, RichTextItemResponse } from "@notionhq/client";
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
