import AboutContent from "@/components/tiles/about/AboutContent";
import { getGroupedPortfolio } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { Work, Education, Prize } = await getGroupedPortfolio();
  return <AboutContent work={Work} education={Education} prize={Prize} />;
}
