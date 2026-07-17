import type { PortfolioBlock } from "@/lib/notion";

function groupBlocks(blocks: PortfolioBlock[]) {
  const groups: (PortfolioBlock | { type: "bulleted_group" | "numbered_group"; items: string[] })[] = [];

  for (const block of blocks) {
    const last = groups[groups.length - 1];
    if (block.type === "bulleted_list_item") {
      if (last && last.type === "bulleted_group") {
        last.items.push(block.text);
      } else {
        groups.push({ type: "bulleted_group", items: [block.text] });
      }
      continue;
    }
    if (block.type === "numbered_list_item") {
      if (last && last.type === "numbered_group") {
        last.items.push(block.text);
      } else {
        groups.push({ type: "numbered_group", items: [block.text] });
      }
      continue;
    }
    groups.push(block);
  }

  return groups;
}

export default function NotionBlocks({
  blocks,
  onImageClick,
}: {
  blocks: PortfolioBlock[];
  onImageClick?: (url: string) => void;
}) {
  if (blocks.length === 0) return null;

  const groups = groupBlocks(blocks);

  return (
    <div className="space-y-3">
      {groups.map((block, index) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p key={index} className="text-sm leading-relaxed text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                {block.text}
              </p>
            );
          case "heading_2":
            return (
              <h4 key={index} className="text-base font-bold text-gray-900 dark:text-white">
                {block.text}
              </h4>
            );
          case "heading_3":
            return (
              <h5 key={index} className="text-sm font-bold text-gray-900 dark:text-white">
                {block.text}
              </h5>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-2 border-gray-300 pl-3 text-sm italic text-gray-600 dark:border-gray-600 dark:text-gray-300"
              >
                {block.text}
              </blockquote>
            );
          case "divider":
            return <hr key={index} className="border-gray-200 dark:border-gray-700" />;
          case "image":
            return (
              <button
                key={index}
                type="button"
                onClick={() => onImageClick?.(block.url)}
                className="block w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.caption || ""}
                  className="w-full rounded-2xl border border-gray-200 dark:border-gray-700"
                />
              </button>
            );
          case "bulleted_group":
            return (
              <ul key={index} className="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          case "numbered_group":
            return (
              <ol key={index} className="list-decimal space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
