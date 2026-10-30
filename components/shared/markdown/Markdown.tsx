import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
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

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

const isSafeHref = (href: string | undefined): href is string => {
  if (!href) return false;
  try {
    // The base only resolves relative links; they are judged by protocol too.
    return SAFE_PROTOCOLS.has(new URL(href, "https://invalid.local").protocol);
  } catch {
    return false;
  }
};

const SafeLink = ({
  href,
  children,
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
  isSafeHref(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow">
      {children}
    </a>
  ) : (
    <span>{children}</span>
  );

// Images become a text link and are never loaded: fetching one would hand
// every viewer's IP to whoever wrote the comment or steered the AI summary.
const ImageAsLink = ({
  src,
  alt,
}: React.ImgHTMLAttributes<HTMLImageElement>) => (
  <SafeLink href={typeof src === "string" ? src : undefined}>
    {alt || "gambar"}
  </SafeLink>
);

const COMPONENTS: Components = { a: SafeLink, img: ImageAsLink };

// Markdown from the AI summary or from GitHub/GitLab comments — untrusted.
// Raw HTML is never rendered (no rehype-raw, no dangerouslySetInnerHTML).
const Markdown = React.memo(({ children, tone }: MarkdownProps) => (
  <div className={markdown({ tone })}>
    <ReactMarkdown components={COMPONENTS}>{children}</ReactMarkdown>
  </div>
));

Markdown.displayName = "Markdown";

export default Markdown;
