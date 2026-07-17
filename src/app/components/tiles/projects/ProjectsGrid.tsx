"use client";
import { useEffect, useState, useRef } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { FiExternalLink, FiX } from "react-icons/fi";
import { SortableItem } from "@/components/SortableItem";
import BentoTile from "@/components/BentoTile";
import ModalPortal from "@/components/ModalPortal";
import NotionBlocks from "@/components/NotionBlocks";
import ProjectTile from "@/components/tiles/projects/projectTile";
import type { PortfolioBlock, PortfolioItem } from "@/lib/notion";

export default function ProjectsGrid({ projects }: { projects: PortfolioItem[] }) {
    const [items, setItems] = useState(projects.map((p) => p.id));
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(true);
    const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
    const [imageViewer, setImageViewer] = useState<string | null>(null);
    const [contentBlocks, setContentBlocks] = useState<PortfolioBlock[] | null>(null);
    const [contentLoading, setContentLoading] = useState(false);

    const gridRef = useRef<HTMLDivElement>(null);
    const lastUpdate = useRef<number>(0);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(max-width: 767px)");
        const updateIsMobile = () => setIsMobile(mediaQuery.matches);

        updateIsMobile();
        mediaQuery.addEventListener("change", updateIsMobile);

        return () => mediaQuery.removeEventListener("change", updateIsMobile);
    }, []);

    useEffect(() => {
        if (!selectedProject) {
            setContentBlocks(null);
            return;
        }
        let cancelled = false;
        setContentLoading(true);
        fetch(`/api/notion/${selectedProject.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (!cancelled) setContentBlocks(data.blocks ?? []);
            })
            .catch(() => {
                if (!cancelled) setContentBlocks([]);
            })
            .finally(() => {
                if (!cancelled) setContentLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedProject]);

    useEffect(() => {
        const isAnyModalOpen = Boolean(selectedProject || imageViewer);
        const previousOverflow = document.body.style.overflow;
        if (isAnyModalOpen) document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [selectedProject, imageViewer]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: import("@dnd-kit/core").DragStartEvent) => {
        setActiveId(event.active.id?.toString());
    };

    const handleDragOver = (event: import("@dnd-kit/core").DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeIdStr = active.id.toString();
        const overIdStr = over.id.toString();

        if (activeIdStr !== overIdStr) {
            const now = Date.now();
            if (now - lastUpdate.current > 150) {
                setItems((prev) => {
                    const oldIndex = prev.indexOf(activeIdStr);
                    const newIndex = prev.indexOf(overIdStr);
                    return arrayMove(prev, oldIndex, newIndex);
                });
                lastUpdate.current = now;
            }
        }
    };

    const handleDragEnd = () => {
        setActiveId(null);
    };

    if (projects.length === 0) {
        return (
            <main className="min-h-screen py-5 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    아직 공개된 프로젝트가 없습니다.
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen py-5 flex justify-center">
            <div className="w-full max-w-300 px-4">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToFirstScrollableAncestor]}
                >
                    <SortableContext items={items} strategy={rectSortingStrategy}>
                        <div
                            ref={gridRef}
                            className="grid grid-cols-1 md:grid-cols-2 max-w-300 w-full"
                        >
                            {items.map((id) => {
                                const project = projects.find((p) => p.id === id);
                                if (!project) return null;

                                return (
                                    <SortableItem key={id} id={id} disabled={isMobile}>
                                        <BentoTile className="w-full h-full md:h-75 transition-all duration-200">
                                            <ProjectTile project={project} onClick={() => setSelectedProject(project)} />
                                        </BentoTile>
                                    </SortableItem>
                                );
                            })}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId ? (() => {
                            if (isMobile) return null;
                            const activeProject = projects.find((p) => p.id === activeId);
                            if (!activeProject) return null;
                            return (
                                <BentoTile
                                    className="w-full h-full md:h-75 pointer-events-none"
                                    innerClassName="scale-105 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                                >
                                    <ProjectTile project={activeProject} />
                                </BentoTile>
                            );
                        })() : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {selectedProject && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm modal-backdrop-enter">
                        <div className="w-full max-w-2xl rounded-4xl border border-gray-200 bg-[#f8fafc] shadow-2xl dark:border-gray-700 dark:bg-[#0d1117] modal-content-enter">
                            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-5 md:px-6">
                                <div className="min-w-0">
                                    <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                                        {selectedProject.title}
                                    </h3>
                                    {selectedProject.period && (
                                        <p className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">{selectedProject.period}</p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProject(null)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-[#151f2b]"
                                    aria-label="Close details"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6">
                                {selectedProject.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <section className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111821]">
                                    {contentLoading ? (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">불러오는 중...</p>
                                    ) : contentBlocks && contentBlocks.length > 0 ? (
                                        <NotionBlocks blocks={contentBlocks} onImageClick={setImageViewer} />
                                    ) : selectedProject.description ? (
                                        <p className="text-xs leading-6 text-gray-700 dark:text-gray-200 sm:text-sm sm:leading-7">
                                            {selectedProject.description}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-400 dark:text-gray-500">등록된 내용이 없습니다.</p>
                                    )}
                                </section>

                                {selectedProject.link && (
                                    <a
                                        href={selectedProject.link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200 dark:hover:bg-[#151f2b]"
                                    >
                                        링크 바로가기
                                        <FiExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {imageViewer && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[1020] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm modal-backdrop-enter">
                        <div className="w-full max-w-3xl rounded-3xl border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-[#0d1117] modal-content-enter">
                            <div className="mb-3 flex items-center justify-end px-1">
                                <button
                                    type="button"
                                    onClick={() => setImageViewer(null)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-[#151f2b]"
                                    aria-label="Close image preview"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="relative h-[56vh] w-full overflow-hidden rounded-2xl border border-gray-200 bg-[#f8fafc] dark:border-gray-700 dark:bg-[#111821]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageViewer} alt="" className="h-full w-full object-contain" />
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </main>
    );
}
