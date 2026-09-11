import faqSource from "../content/biscetta/faq.md?raw";

type ParagraphBlock = { type: "paragraph"; text: string };
type ListBlock = { type: "list"; items: string[] };
export type FaqBlock = ParagraphBlock | ListBlock;
export type Faq = { question: string; blocks: FaqBlock[] };
export type FaqGroup = { title: string; items: Faq[] };

export const faqGroups: FaqGroup[] = [];
let currentGroup: FaqGroup | undefined;
let currentFaq: Faq | undefined;

for (const sourceLine of faqSource.split(/\r?\n/)) {
  const line = sourceLine.trim();
  if (line.startsWith("## ")) {
    const title = line.slice(3);
    if (title === "関連ページ") break;
    currentGroup = { title, items: [] };
    faqGroups.push(currentGroup);
    currentFaq = undefined;
    continue;
  }
  if (line.startsWith("### ") && currentGroup) {
    currentFaq = { question: line.slice(4), blocks: [] };
    currentGroup.items.push(currentFaq);
    continue;
  }
  if (!line || !currentFaq) continue;
  if (line.startsWith("- ")) {
    const previous = currentFaq.blocks.at(-1);
    if (previous?.type === "list") previous.items.push(line.slice(2));
    else currentFaq.blocks.push({ type: "list", items: [line.slice(2)] });
  } else {
    currentFaq.blocks.push({ type: "paragraph", text: line });
  }
}

const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const inlineMarkdown = (value: string) =>
  escapeHtml(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

export const faqEntities = faqGroups.flatMap((group) =>
  group.items.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.blocks
        .map((block) => (block.type === "paragraph" ? block.text : block.items.join("、")))
        .join(" "),
    },
  })),
);
