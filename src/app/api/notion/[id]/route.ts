import { NextResponse } from "next/server";
import { getPortfolioItemContent } from "@/lib/notion";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const blocks = await getPortfolioItemContent(id);
    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Failed to fetch Notion page content:", error);
    return NextResponse.json({ error: "content unavailable" }, { status: 502 });
  }
}
