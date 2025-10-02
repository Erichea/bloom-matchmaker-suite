import React, { useState, useRef, useEffect, useMemo } from 'react';

type IconComponentType = React.ElementType<{ className?: string }>;

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  onClick?: () => void;
  badge?: number;
}

export interface InteractiveMenuProps {
  items: InteractiveMenuItem[];
  accentColor?: string;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
}

const defaultAccentColor = 'hsl(var(--primary))';

export const InteractiveMenu: React.FC<InteractiveMenuProps> = ({
  items,
  accentColor = defaultAccentColor,
  activeIndex: controlledActiveIndex,
  onActiveIndexChange
}) => {
  const [internalActiveIndex, setInternalActiveIndex] = useState(0);
  const activeIndex = controlledActiveIndex ?? internalActiveIndex;

  const textRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lineRef = useRef<HTMLDivElement>(null);

  const setActiveIndex = (index: number) => {
    if (controlledActiveIndex === undefined) {
      setInternalActiveIndex(index);
    }
    onActiveIndexChange?.(index);
  };

  useEffect(() => {
    if (activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items, activeIndex]);

  useEffect(() => {
    const setLinePosition = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];
      const lineElement = lineRef.current;

      if (activeItemElement && activeTextElement && lineElement) {
        const textWidth = activeTextElement.getBoundingClientRect().width;
        const itemLeft = activeItemElement.offsetLeft;
        const itemWidth = activeItemElement.offsetWidth;
        const textLeft = activeTextElement.offsetLeft;

        const lineLeft = itemLeft + textLeft;
        lineElement.style.width = `${textWidth}px`;
        lineElement.style.transform = `translateX(${lineLeft}px)`;
      }
    };

    setLinePosition();
    window.addEventListener('resize', setLinePosition);
    return () => window.removeEventListener('resize', setLinePosition);
  }, [activeIndex, items]);

  const handleClick = (index: number, onClick?: () => void) => {
    setActiveIndex(index);
    onClick?.();
  };

  return (
    <nav className="relative flex items-center justify-around gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div
        ref={lineRef}
        className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-300 ease-out"
        style={{ backgroundColor: accentColor }}
      />
      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === activeIndex;

        return (
          <button
            key={index}
            ref={(el) => (itemRefs.current[index] = el)}
            onClick={() => handleClick(index, item.onClick)}
            className="relative flex flex-col items-center gap-1.5 px-4 py-3 transition-all duration-300"
            style={{
              color: isActive ? accentColor : 'hsl(var(--muted-foreground))',
            }}
          >
            <div className="relative">
              <Icon
                className={`h-6 w-6 transition-all duration-300 ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </div>
            <span
              ref={(el) => (textRefs.current[index] = el)}
              className={`text-xs transition-all duration-300 ${
                isActive ? 'font-semibold' : 'font-normal'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
