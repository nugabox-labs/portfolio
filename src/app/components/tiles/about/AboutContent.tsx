"use client";

import { FiArrowUpRight, FiExternalLink, FiX, FiCode } from "react-icons/fi";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import styled, { keyframes } from "styled-components";
import type { PortfolioItem, PortfolioCategory } from "@/lib/notion";

const spinGlow = keyframes`
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
`;

const GlowContainer = styled.div`
  position: relative;
  padding: 1.5px;
  background: transparent;
  overflow: hidden;
  border-radius: 1.5rem;
  height: 100%;
  display: flex;
`;

const GlowBorder = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300%;
  height: 300%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 100deg,
    #63fafacd 150deg,
    #60a5fa 180deg,
    transparent 230deg,
    transparent 360deg
  );
  animation: ${spinGlow} 4s linear infinite;
  z-index: 0;
  filter: blur(4px);
`;

const skills = ["Full-stack Developer"];

const TAB_LABEL: Record<PortfolioCategory, string> = {
  Work: "Experience",
  Education: "Education",
  Prize: "Prize",
  Project: "Project",
};

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-[#111821] dark:text-gray-200">
      <FiCode className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function TagPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200">
      {label}
    </span>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-4xl bg-white p-4 dark:bg-[#0d1117] dark:ring-2 dark:ring-gray-700 sm:p-5 lg:p-6">
      <div className="flex items-center justify-between gap-3 pb-4">
        <h2 className="text-lg font-bold font-decorative tracking-tight text-gray-900 dark:text-white sm:text-xl md:text-2xl">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full border border-gray-200/80 bg-white/90 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-[#111821] dark:text-gray-200">
            {badge}
          </span>
        )}
      </div>
      <div>{children}</div>
    </section>
  );
}

function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

function ItemCard({
  item,
  onClick,
}: {
  item: PortfolioItem;
  onClick: () => void;
}) {
  return (
    <GlowContainer>
      <GlowBorder />
      <article
        className="relative z-10 h-full w-full rounded-[calc(1.5rem-1.5px)] border border-gray-200 bg-white p-3.5 dark:border-gray-700 dark:bg-[#111821] cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-gray-200 dark:hover:ring-gray-600 sm:p-4 overflow-hidden"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
            {item.title}
          </h3>
          {item.period && (
            <span className="inline-flex shrink-0 whitespace-nowrap items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200">
              {item.period}
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm line-clamp-2">
            {item.description}
          </p>
        )}
        {item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <TagPill key={tag} label={tag} />
            ))}
          </div>
        )}
      </article>
    </GlowContainer>
  );
}

export default function AboutContent({
  work,
  education,
  prize,
}: {
  work: PortfolioItem[];
  education: PortfolioItem[];
  prize: PortfolioItem[];
}) {
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [imageViewer, setImageViewer] = useState<{ urls: string[]; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<PortfolioCategory>("Work");

  const previewWork = useMemo(() => work.slice(0, 2), [work]);
  const previewEducation = useMemo(() => education.slice(0, 2), [education]);
  const previewPrize = useMemo(() => prize.slice(0, 2), [prize]);

  const tabItems: Record<PortfolioCategory, PortfolioItem[]> = {
    Work: work,
    Education: education,
    Prize: prize,
    Project: [],
  };

  useEffect(() => {
    const isAnyModalOpen = Boolean(selectedItem || imageViewer || isTimelineOpen);
    const previousOverflow = document.body.style.overflow;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedItem, imageViewer, isTimelineOpen]);

  return (
    <main className="min-h-screen py-5 flex justify-center">
      <div className="max-w-[1200px] w-full px-4">
        <div className="grid grid-cols-1 gap-5">
          <section className="min-h-75 rounded-4xl bg-white p-4 dark:bg-[#0d1117] dark:ring-2 dark:ring-gray-700 sm:p-5 md:px-10 lg:px-16">
            <div className="h-full flex flex-col justify-center">
              <div className="flex items-center gap-6 mb-3">
                <div className="relative w-24 h-24 shrink-0">
                  <Image
                    src="/images/mepopper.png"
                    alt="Profile"
                    width={100}
                    height={100}
                    className="rounded-full"
                  />
                </div>
              </div>
              <p className="mt-3 text-gray-500 dark:text-gray-300 text-xs leading-relaxed sm:text-sm md:text-base max-w-[900px]">
                끊임없이 배우고 실행하는 개발자입니다. 기술은 넓게 보고, 이해는 깊게 가져가려 합니다. 혼자 성장하는 속도보다 함께 성장하는 방향을 더 중요하게 생각합니다.
              </p>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {skills.map((skill) => (
                  <Pill key={skill} label={skill} />
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionCard title="Experience" badge="Career">
                <div className="space-y-3.5">
                  {previewWork.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                  {work.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">등록된 경력이 없습니다.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Work");
                      setIsTimelineOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200 dark:hover:bg-[#151f2b]"
                  >
                    See all experience
                    <FiArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-4">
              <SectionCard title="Education" badge="Studies">
                <div className="space-y-3.5">
                  {previewEducation.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                  {education.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">등록된 학력이 없습니다.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Education");
                      setIsTimelineOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200 dark:hover:bg-[#151f2b]"
                  >
                    See all studies
                    <FiArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SectionCard>
            </div>

            <div className="lg:col-span-3">
              <SectionCard title="Prize" badge="Awards">
                <div className="space-y-3.5">
                  {previewPrize.map((item) => (
                    <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                  {prize.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500">등록된 수상이 없습니다.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("Prize");
                      setIsTimelineOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200 dark:hover:bg-[#151f2b]"
                  >
                    See all prizes
                    <FiArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {selectedItem && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm modal-backdrop-enter">
            <div className="w-full max-w-2xl rounded-4xl border border-gray-200 bg-[#f8fafc] shadow-2xl dark:border-gray-700 dark:bg-[#0d1117] modal-content-enter">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700 sm:px-5 md:px-6">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.period && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 sm:text-sm">{selectedItem.period}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-[#151f2b]"
                  aria-label="Close details"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 md:px-6">
                {selectedItem.description && (
                  <section className="rounded-3xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-[#111821]">
                    <p className="text-xs leading-6 text-gray-700 dark:text-gray-200 sm:text-sm sm:leading-7">
                      {selectedItem.description}
                    </p>
                  </section>
                )}

                {selectedItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag) => (
                      <TagPill key={tag} label={tag} />
                    ))}
                  </div>
                )}

                {selectedItem.imageUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedItem.imageUrls.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        className="relative h-28 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-[#0d1117]"
                        onClick={() => setImageViewer({ urls: selectedItem.imageUrls, index })}
                      >
                        <Image src={url} alt={selectedItem.title} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {selectedItem.link && (
                  <a
                    href={selectedItem.link}
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
                <Image src={imageViewer.urls[imageViewer.index]} alt="" fill className="object-contain" />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {isTimelineOpen && (
        <ModalPortal>
          <div className="fixed inset-0 z-[1010] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm modal-backdrop-enter">
            <div className="w-full max-w-3xl rounded-4xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-[#0d1117] modal-content-enter sm:p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">Timeline</h3>
                <button
                  type="button"
                  onClick={() => setIsTimelineOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-[#151f2b]"
                  aria-label="Close timeline"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex gap-2">
                {(["Work", "Education", "Prize"] as PortfolioCategory[]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveTab(category)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      activeTab === category
                        ? "bg-gray-900 text-white dark:bg-white dark:text-[#0d1117]"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-[#0d1117] dark:text-gray-200 dark:hover:bg-[#151f2b]"
                    }`}
                  >
                    {TAB_LABEL[category]}
                  </button>
                ))}
              </div>

              <div className="mt-5 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {tabItems[activeTab].map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onClick={() => {
                      setSelectedItem(item);
                      setIsTimelineOpen(false);
                    }}
                  />
                ))}
                {tabItems[activeTab].length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">등록된 항목이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </main>
  );
}
