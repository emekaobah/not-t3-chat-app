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
      const MIN_CARD_WIDTH = 350;
      const PREFERRED_CARD_WIDTH = 450;
      const GAP = 16;
      const PADDING = 32;

      const availableWidth = containerWidth - PADDING;

      // For 2 cards: always use grid if each card can be at least MIN_CARD_WIDTH
      if (cardCount === 2) {
        const availablePerCard = (availableWidth - GAP) / 2;
        if (availablePerCard >= MIN_CARD_WIDTH) {
          setLayout({
            type: "grid",
            canFitAll: true,
            visibleCards: 2,
          });
          return;
        }
      }

      // For 3+ cards or narrow screens: use flex-scroll
      const totalNeededWidth =
        cardCount * PREFERRED_CARD_WIDTH + (cardCount - 1) * GAP;
      const canFitAll = totalNeededWidth <= availableWidth;
      const visibleCards = Math.floor(
        availableWidth / (PREFERRED_CARD_WIDTH + GAP)
      );

      setLayout({
        type: "flex-scroll",
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
