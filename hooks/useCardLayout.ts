import { useEffect, useRef, useState } from "react";

interface LayoutState {
  type: "grid" | "flex-scroll";
  canFitAll: boolean;
  visibleCards: number;
}

export const useCardLayout = (cardCount: number) => {
  const [layout, setLayout] = useState<LayoutState>({
    type: "grid",
    canFitAll: true,
    visibleCards: cardCount,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const calculateLayout = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const CARD_WIDTH = 400;
      const GAP = 16;
      const PADDING = 32;

      const availableWidth = containerWidth - PADDING;
      const totalNeededWidth = cardCount * CARD_WIDTH + (cardCount - 1) * GAP;

      const canFitAll = totalNeededWidth <= availableWidth;
      const visibleCards = Math.floor(availableWidth / (CARD_WIDTH + GAP));

      setLayout({
        type: canFitAll && cardCount <= 2 ? "grid" : "flex-scroll",
        canFitAll,
        visibleCards: Math.min(visibleCards, cardCount),
      });
    };

    calculateLayout();

    // Use ResizeObserver for more accurate detection
    const resizeObserver = new ResizeObserver(calculateLayout);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [cardCount]);

  return { layout, containerRef };
};
