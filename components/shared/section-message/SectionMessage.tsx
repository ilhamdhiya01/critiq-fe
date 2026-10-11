import classNames from "classnames";
import React from "react";

interface SectionMessageProps {
  tone?: "muted" | "danger";
  children: React.ReactNode;
}

// Empty / failed-to-load line inside a SectionCard.
const SectionMessage = React.memo(
  ({ tone = "muted", children }: SectionMessageProps) => (
    <p
      role={tone === "danger" ? "alert" : undefined}
      className={classNames("px-5 py-8 text-center text-[12.5px]", {
        "text-text-secondary": tone === "muted",
        "text-danger-light": tone === "danger",
      })}
    >
      {children}
    </p>
  ),
);

SectionMessage.displayName = "SectionMessage";

export default SectionMessage;
