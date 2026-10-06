// Web navigation for the (tabs) layout, drawn from the same <Tabs.Screen>
// config the app declares. Two presentations, switched by CSS in global.css:
//   < 768px  .tn-bar   flat 56px bottom bar inside the app column
//   ≥ 768px  .tn-side  left sidebar (icons only; icons + labels ≥ 1200px)
// The sidebar is portaled to <body> because #root is a transformed column,
// and `body.has-sidebar` shifts that column right to make room for it.
"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import appIcon from "@/assets/images/app-icon.png";

export type WebTabItem = {
  name: string;
  title?: string;
  icon?: (props: { color: string; size: number; focused: boolean }) => ReactNode;
  badge?: string | number;
  /** Set for the app's center "+" (FloatingTabButton) tab. */
  isCreate: boolean;
};

type Props = {
  items: WebTabItem[];
  isActive: (name: string) => boolean;
  onSelect: (name: string) => void;
  activeColor: string;
  inactiveColor: string;
  background: string;
};

const ACCENT = "#6C3EF4";

function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function Badge({ value }: { value: string | number }) {
  return <span className="tn-badge">{value}</span>;
}

function label(item: WebTabItem) {
  return item.isCreate ? "Create" : item.title || item.name;
}

export function WebTabNavigation({ items, isActive, onSelect, activeColor, inactiveColor, background }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.body.classList.add("has-sidebar");
    return () => document.body.classList.remove("has-sidebar");
  }, []);

  const bar = (
    <nav className="tn-bar" style={{ background }} aria-label="Main">
      {items.map((item) => {
        const active = isActive(item.name);
        const color = active ? activeColor : inactiveColor;
        if (item.isCreate) {
          return (
            <button key={item.name} type="button" className="tn-bar-item" onClick={() => onSelect(item.name)} aria-label="Create">
              <span className="tn-create" style={{ background: ACCENT }}>
                <PlusIcon size={20} />
              </span>
            </button>
          );
        }
        return (
          <button
            key={item.name}
            type="button"
            className="tn-bar-item"
            onClick={() => onSelect(item.name)}
            aria-label={label(item)}
            aria-current={active ? "page" : undefined}
            style={{ color }}
          >
            <span className="tn-icon">
              {item.icon?.({ color, size: 22, focused: active })}
              {item.badge ? <Badge value={item.badge} /> : null}
            </span>
            <span className="tn-bar-label">{label(item)}</span>
          </button>
        );
      })}
    </nav>
  );

  const sidebar = (
    <nav className="tn-side" style={{ background }} aria-label="Main">
      <button type="button" className="tn-brand" onClick={() => onSelect(items[0]?.name ?? "index")} aria-label="3NAMES home">
        <img src={appIcon as unknown as string} alt="" width={36} height={36} />
        <span className="tn-label tn-wordmark">3NAMES</span>
      </button>
      {items.map((item) => {
        const active = isActive(item.name);
        const color = active ? activeColor : inactiveColor;
        return (
          <button
            key={item.name}
            type="button"
            className={"tn-side-item" + (active ? " is-active" : "") + (item.isCreate ? " is-create" : "")}
            onClick={() => onSelect(item.name)}
            aria-label={label(item)}
            aria-current={active ? "page" : undefined}
            title={label(item)}
            style={{ color: item.isCreate ? ACCENT : color }}
          >
            <span className="tn-icon">
              {item.isCreate ? (
                <span className="tn-create tn-create-sm" style={{ background: ACCENT }}>
                  <PlusIcon size={16} />
                </span>
              ) : (
                item.icon?.({ color, size: 24, focused: active })
              )}
              {item.badge ? <Badge value={item.badge} /> : null}
            </span>
            <span className="tn-label">{label(item)}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {bar}
      {mounted ? createPortal(sidebar, document.body) : null}
    </>
  );
}

export type CustomTabButton = ComponentType<{ onPress?: () => void; children?: ReactNode }>;
