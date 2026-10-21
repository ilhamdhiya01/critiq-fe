import React from "react";
import ReactMarkdown from "react-markdown";
import { tv } from "tailwind-variants";

const markdown = tv({
  base: "flex min-w-0 flex-col gap-2 leading-relaxed wrap-anywhere [&_a]:text-primary-300 [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-raised [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.92em] [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-raised [&_pre]:p-2.5 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
  variants: {
    tone: {
      default: "text-[12.5px] text-text-secondary [&_strong]:text-text-strong",
      ai: "text-[13px] text-primary-100 [&_strong]:text-primary-50",
    },
  },
  defaultVariants: { tone: "default" },
});

interface MarkdownProps {
  children: string;
  tone?: "default" | "ai";
}

// Markdown from the AI summary or from GitHub/GitLab comments. Raw HTML is
// not rendered (react-markdown escapes it by default).
const Markdown = React.memo(({ children, tone }: MarkdownProps) => (
  <div className={markdown({ tone })}>
    <ReactMarkdown>{children}</ReactMarkdown>
  </div>
));

Markdown.displayName = "Markdown";

export default Markdown;
