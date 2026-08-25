import { ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

export type PolicySort = 'recommendation' | 'deadline' | 'support';

const POLICY_SORT_OPTIONS: { value: PolicySort; label: string }[] = [
  { value: 'recommendation', label: '추천순' },
  { value: 'deadline', label: '마감 임박순' },
  { value: 'support', label: '지원 금액순' },
];

interface PolicySortMenuProps {
  value: PolicySort;
  onChange: (value: PolicySort) => void;
}

function PolicySortMenu({ value, onChange }: PolicySortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = POLICY_SORT_OPTIONS.findIndex((option) => option.value === value);
  const selectedOption = POLICY_SORT_OPTIONS[selectedIndex] ?? POLICY_SORT_OPTIONS[0];

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen]);

  const focusOption = (index: number) => {
    const optionCount = POLICY_SORT_OPTIONS.length;
    const nextIndex = (index + optionCount) % optionCount;
    optionRefs.current[nextIndex]?.focus();
  };

  const openAndFocusSelected = () => {
    setIsOpen(true);
    window.requestAnimationFrame(() => focusOption(Math.max(0, selectedIndex)));
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      setIsOpen(false);
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openAndFocusSelected();
  };

  const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusOption(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusOption(index - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusOption(POLICY_SORT_OPTIONS.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
    }
  };

  const selectOption = (nextValue: PolicySort) => {
    onChange(nextValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div
      className={`policies__sort-control ${isOpen ? 'is-open' : ''}`}
      ref={containerRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false);
      }}
    >
      <button
        className="policies__sort-trigger"
        type="button"
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="policy-sort-menu"
        aria-label={`정책 정렬 기준: ${selectedOption.label}`}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <ArrowUpDown size={16} aria-hidden="true" />
        <span>{selectedOption.label}</span>
        <ChevronDown className="policies__sort-chevron" size={15} aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          className="policies__sort-menu"
          id="policy-sort-menu"
          role="menu"
          aria-label="정책 정렬 기준"
        >
          {POLICY_SORT_OPTIONS.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                className={`policies__sort-option ${selected ? 'is-selected' : ''}`}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                key={option.value}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                onClick={() => selectOption(option.value)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span>{option.label}</span>
                {selected ? <Check size={14} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default PolicySortMenu;
