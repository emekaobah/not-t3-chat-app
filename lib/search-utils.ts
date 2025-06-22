import React from "react";

/**
 * Highlights search terms in text with HTML markup
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(
    `(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  return text.replace(
    regex,
    '<mark class="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">$1</mark>'
  );
}

/**
 * Creates a React component that renders highlighted text
 */
export function HighlightedText({
  text,
  searchTerm,
}: {
  text: string;
  searchTerm: string;
}) {
  const highlightedText = highlightSearchTerm(text, searchTerm);

  return React.createElement("span", {
    dangerouslySetInnerHTML: { __html: highlightedText },
  });
}
