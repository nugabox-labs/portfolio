import Image from "next/image";
import Link from "next/link";
import type { PortfolioItem } from "@/lib/notion";

export default function ProjectTile({ project }: { project: PortfolioItem }) {
    const imageSrc = project.imageUrls[0] || "/tech/placeholder.svg";

    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-col md:flex-row w-full p-6 md:p-8 gap-4 items-center md:items-start overflow-hidden flex-1">
                {/* 1. Project Preview Image */}
                <div className="w-full md:w-1/2 h-48 md:h-full bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-center shrink-0">
                    <Image src={imageSrc} alt={project.title} width={400} height={300} className="object-cover rounded-2xl" />
                </div>
                {/* 2. Content Section */}
                <div className="flex flex-col justify-between w-full">
                    <div>
                        <h2 className="text-md lg:text-xl font-black text-gray-800 dark:text-gray-100 mb-2 tracking-tight font-decorative">
                            {project.title}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-300 text-sm md:text-xs xl:text-sm leading-relaxed mb-3">
                            {project.description}
                        </p>
                        {/* Category tags */}
                        <div className="flex flex-wrap gap-2 md:mb-8">
                            {project.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-[#111821] dark:text-gray-200"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer Section: Action & Date */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 md:px-8 py-1 rounded-b-2xl shadow-sm border-t border-gray-100 dark:border-gray-700 mt-auto bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 h-10">
                    {project.link && (
                        <Link href={project.link} target="_blank" rel="noopener noreferrer">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors hover:ring-4 ring-gray-200 dark:ring-gray-400 hover:transition duration-700 ease-in-out">
                                <Image src="/images/arrow.svg" alt="View Project" width={20} height={20} />
                            </div>
                        </Link>
                    )}
                </div>
                {project.period && (
                    <span className="text-gray-400 dark:text-gray-300 text-xs font-medium ml-2">
                        {project.period}
                    </span>
                )}
            </div>
        </div>
    );
}
