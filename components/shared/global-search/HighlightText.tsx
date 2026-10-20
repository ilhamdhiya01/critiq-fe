import React from "react";

import { splitHighlight } from "@/lib/helpers/search.helper";

interface HighlightTextProps {
  text: string;
  query: string;
}

// Brightens the parts of `text` that match the search query.
const HighlightText = React.memo(({ text, query }: HighlightTextProps) => (
  <>
    {splitHighlight(text, query).map((part, index) =>
      part.isMatch ? (
        <mark
          key={index}
          className="bg-transparent font-semibold text-neutral-50"
        >
          {part.text}
        </mark>
      ) : (
        <React.Fragment key={index}>{part.text}</React.Fragment>
      ),
    )}
  </>
));

HighlightText.displayName = "HighlightText";

export default HighlightText;
