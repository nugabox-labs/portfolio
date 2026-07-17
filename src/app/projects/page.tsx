import ProjectsGrid from "@/components/tiles/projects/ProjectsGrid";
import { getGroupedPortfolio } from "@/lib/notion";

export const dynamic = "force-dynamic";

export default async function ProjectPage() {
    const { Project: projects } = await getGroupedPortfolio();
    return <ProjectsGrid projects={projects} />;
}
