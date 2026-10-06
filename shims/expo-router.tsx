// Web shim for `expo-router`, built on next/navigation.
//
// Conversion rules (mobile -> web):
//   /            -> auth-gate (app/index.tsx)        [kept as-is]
//   /(tabs)      -> /home   (the (tabs) index screen)
//   /(tabs)/x    -> /x      (route groups are URL-transparent)
//   /(features)/x-> /x
//
// Layouts: generated layout.tsx wrappers put <Stack>/<Tabs> inside a
// RouteContentProvider whose value is the *matched child route* from
// Next.js; Stack/Tabs render that value instead of their own children
// (which are only screen-config elements in expo-router).

"use client";

import React, {
  useContext,
  createContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentType,
} from "react";
import {
  useRouter as useNextRouter,
  useParams,
  useSearchParams,
} from "next/navigation";

/* ------------------------------------------------------------------ */
/* Route content context (populated by generated layout wrappers)      */
/* ------------------------------------------------------------------ */

const RouteContent = createContext<ReactNode>(null);
export const RouteContentProvider = RouteContent.Provider;

/* ------------------------------------------------------------------ */
/* href normalization: expo groups -> web paths                        */
/* ------------------------------------------------------------------ */

type ParamsArg = Record<string, string | number | boolean | null | undefined> | undefined;
type HrefObject = { pathname: string; params?: ParamsArg };
export type Href = string | HrefObject;

export function normalizeHref(href: Href): string {
  if (href && typeof href === "object") {
    const { pathname, params } = href;
    const qs = params
      ? "?" +
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null && v !== "")
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
          .join("&")
      : "";
    return applyGroups(pathname) + qs;
  }
  const raw = String(href);
  const qIndex = raw.indexOf("?");
  const path = qIndex === -1 ? raw : raw.slice(0, qIndex);
  const query = qIndex === -1 ? "" : raw.slice(qIndex);
  return applyGroups(path) + query;
}

function applyGroups(path: string): string {
  if (!path.startsWith("/")) return path;
  const isTabHome = /^\/(\(tabs\))(\/(index)?)?$/.test(path);
  const withoutGroups = path.replace(/\/\([^)]*\)/g, "");
  if (isTabHome) return "/home";
  if (withoutGroups === "" || withoutGroups === "/") {
    // Group-only href like "/(features)" -> root
    return "/";
  }
  return withoutGroups;
}

/* ------------------------------------------------------------------ */
/* Router bridge: lets module-level `router` work outside components   */
/* ------------------------------------------------------------------ */

type RouterLike = {
  push: (href: Href) => void;
  replace: (href: Href) => void;
  back: () => void;
  dismissAll: () => void;
  canDismiss: () => boolean;
  navigate: (href: Href) => void;
};

let activePush: ((href: string) => void) | null = null;
let activeReplace: ((href: string) => void) | null = null;
let activeBack: (() => void) | null = null;

function bridgePush(href: Href) {
  const target = normalizeHref(href);
  if (activePush) activePush(target);
  else if (typeof window !== "undefined") window.location.assign(target);
}

function bridgeReplace(href: Href) {
  const target = normalizeHref(href);
  if (activeReplace) activeReplace(target);
  else if (typeof window !== "undefined") window.location.replace(target);
}

function bridgeBack() {
  if (activeBack) activeBack();
  else if (typeof window !== "undefined") window.history.back();
}

export const router: RouterLike = {
  push: bridgePush,
  replace: bridgeReplace,
  back: bridgeBack,
  navigate: bridgePush,
  // Web has no modal stack; approximate by unwinding one entry.
  dismissAll: () => bridgeBack(),
  canDismiss: () => typeof window !== "undefined" && window.history.length > 1,
};

/** Registers the live Next router instance. Mounted once by the root shell. */
export function useRouterBridge() {
  const next = useNextRouter();
  const stable = useMemo<RouterLike>(
    () => ({
      push: (h) => next.push(normalizeHref(h)),
      replace: (h) => next.replace(normalizeHref(h)),
      back: () => next.back(),
      navigate: (h) => next.push(normalizeHref(h)),
      dismissAll: () => next.back(),
      canDismiss: () => typeof window !== "undefined" && window.history.length > 1,
    }),
    [next]
  );
  activePush = (h) => next.push(h);
  activeReplace = (h) => next.replace(h);
  activeBack = () => next.back();
  return stable;
}

export function useRouter(): RouterLike {
  return useRouterBridge();
}

/* ------------------------------------------------------------------ */
/* Params                                                              */
/* ------------------------------------------------------------------ */

type ParamsValue = string | string[] | undefined;
type LocalParams<T> = T & Record<string, ParamsValue>;

export function useLocalSearchParams<T extends Record<string, ParamsValue> = Record<string, ParamsValue>>(): LocalParams<T> {
  const pathParams = useParams();
  const searchParams = useSearchParams();
  return useMemo(() => {
    const query: Record<string, ParamsValue> = {};
    searchParams.forEach((value, key) => {
      const prev = query[key];
      if (prev === undefined) query[key] = value;
      else if (Array.isArray(prev)) prev.push(value);
      else query[key] = [prev, value];
    });
    return { ...(pathParams as Record<string, ParamsValue>), ...query } as LocalParams<T>;
  }, [pathParams, searchParams]);
}

export function usePathname(): string {
  return useNextPathname();
}

// Alias import (avoid shadowing above)
import { usePathname as useNextPathname } from "next/navigation";
import { StyleSheet } from "react-native";
import { WebTabNavigation, type WebTabItem } from "./web-tab-navigation";

/* ------------------------------------------------------------------ */
/* useFocusEffect: re-run when the callback identity or route changes  */
/* ------------------------------------------------------------------ */

export function useFocusEffect(effect: () => void | (() => void)) {
  const pathname = useNextPathname();
  const cbRef = useRef(effect);
  cbRef.current = effect;
  useEffect(() => {
    const cleanup = cbRef.current();
    return typeof cleanup === "function" ? cleanup : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effect, pathname]);
}

/* ------------------------------------------------------------------ */
/* Stack / Tabs / Screen                                               */
/* ------------------------------------------------------------------ */

export type ScreenOptions = {
  title?: string;
  headerShown?: boolean;
  tabBarIcon?: (props: { color: string; size: number; focused: boolean }) => ReactNode;
  tabBarButton?: (props: { onPress?: () => void; children?: ReactNode; [key: string]: any }) => ReactNode;
  tabBarBadge?: string | number;
  tabBarStyle?: Record<string, unknown>;
  [key: string]: any;
};

type ScreenComponentProps = {
  name?: string;
  options?: ScreenOptions | ((args: { route: unknown; navigation: unknown }) => ScreenOptions);
};

function StackImpl(_props: { children?: ReactNode; screenOptions?: ScreenOptions }) {
  const content = useContext(RouteContent);
  return <>{content}</>;
}
function StackScreen(_props: ScreenComponentProps) {
  return null;
}
export const Stack = Object.assign(StackImpl, { Screen: StackScreen });

/* --- Tab bar visibility (set by standalone <Tabs.Screen> usage) ----- */

let tabHidden = false;
const tabListeners = new Set<(hidden: boolean) => void>();

function setTabBarHidden(hidden: boolean) {
  if (tabHidden === hidden) return;
  tabHidden = hidden;
  tabListeners.forEach((l) => l(hidden));
}

function useTabBarHidden(): boolean {
  const [hidden, setHidden] = useState(tabHidden);
  useEffect(() => {
    const l = (h: boolean) => setHidden(h);
    tabListeners.add(l);
    setHidden(tabHidden);
    return () => {
      tabListeners.delete(l);
    };
  }, []);
  return hidden;
}

/** Standalone use (inside a screen): hides the tab bar while mounted. */
export function TabsScreenStandalone(props: ScreenComponentProps) {
  const options = typeof props.options === "function" ? undefined : props.options;
  const style = (options?.tabBarStyle ?? {}) as { display?: string };
  const shouldHide = style.display === "none";
  useEffect(() => {
    setTabBarHidden(shouldHide);
    return () => setTabBarHidden(false);
  }, [shouldHide]);
  return null;
}

type TabConfig = {
  name: string;
  title?: string;
  icon?: (props: { color: string; size: number; focused: boolean }) => ReactNode;
  badge?: string | number | undefined;
  customButton?: ComponentType<{ onPress?: () => void; children?: ReactNode }> | undefined;
};

function isGroupTabPath(pathname: string): boolean {
  // The tab bar belongs to routes served by (tabs)/layout.tsx.
  const tabRoutes = ["/home", "/materials", "/explore", "/chatListScreen", "/profile"];
  return tabRoutes.includes(pathname);
}

function TabsImpl({
  children,
  screenOptions,
}: {
  children?: ReactNode;
  screenOptions?: ScreenOptions;
}) {
  const content = useContext(RouteContent);
  const pathname = useNextPathname();
  const hidden = useTabBarHidden();
  const next = useNextRouter();

  const configs = useMemo<TabConfig[]>(() => {
    const out: TabConfig[] = [];
    const visit = (node: ReactNode) => {
      if (Array.isArray(node)) node.forEach(visit);
      else if (node && typeof node === "object" && "type" in node && (node as any).type === TabsScreen) {
        const el = node as any;
        const options = (el.props.options ?? {}) as any;
        out.push({
          name: String(el.props.name ?? ""),
          title: options.title,
          icon: options.tabBarIcon,
          badge: options.tabBarBadge,
          customButton: options.tabBarButton,
        });
      }
    };
    visit(children);
    return out;
  }, [children]);

  if (configs.length === 0) return <>{content}</>;

  const opts = (screenOptions ?? {}) as {
    tabBarActiveTintColor?: string;
    tabBarInactiveTintColor?: string;
    tabBarStyle?: Record<string, unknown>;
    tabBarLabelStyle?: Record<string, unknown>;
    tabBarShowLabel?: boolean;
  };
  const activeColor = opts.tabBarActiveTintColor ?? "#6C3EF4";
  const inactiveColor = opts.tabBarInactiveTintColor ?? "#7B7B7B";

  const hrefFor = (name: string) => (name === "index" ? "/home" : `/${name}`);
  const isActive = (name: string) => pathname === hrefFor(name);

  const go = (name: string) => next.push(hrefFor(name));

  const items: WebTabItem[] = configs.map((cfg) => ({
    name: cfg.name,
    title: cfg.title,
    icon: cfg.icon,
    badge: cfg.badge,
    isCreate: !!cfg.customButton,
  }));
  const background =
    (opts.tabBarStyle?.backgroundColor as string | undefined) ?? (isDark() ? "#171717" : "#FFFFFF");

  return (
    <>
      {content}
      {!hidden && isGroupTabPath(pathname) && (
        <WebTabNavigation
          items={items}
          isActive={isActive}
          onSelect={go}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          background={background}
        />
      )}
    </>
  );
}

function isDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function TabsScreen(props: ScreenComponentProps) {
  // As a child of <Tabs> this is pure config (Tabs reads it from
  // children without rendering it). Standalone inside a screen it
  // hides the tab bar while mounted.
  return <TabsScreenStandalone {...props} />;
};
export { TabsScreen as TabScreen };
export const Tabs = Object.assign(TabsImpl, { Screen: TabsScreen });

/* ------------------------------------------------------------------ */
/* Redirect / Link / useNavigation                                     */
/* ------------------------------------------------------------------ */

export function Redirect({ href }: { href: Href }) {
  const next = useNextRouter();
  useEffect(() => {
    next.replace(normalizeHref(href));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function Link({
  href,
  children,
  onPress,
  ...rest
}: {
  href: Href;
  children?: ReactNode;
  onPress?: (event: React.MouseEvent<HTMLAnchorElement>) => void | Promise<void>;
  target?: string;
  replace?: boolean;
  [key: string]: unknown;
}) {
  const url = normalizeHref(href);
  const { target, replace, style, className, id } = rest as {
    target?: string;
    replace?: boolean;
    style?: unknown;
    className?: string;
    id?: string;
  };
  return (
    <a
      href={url}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={className}
      id={id}
      style={StyleSheet.flatten(style as never) as React.CSSProperties}
      onClick={(e) => {
        onPress?.(e);
        if (e.defaultPrevented) return;
        // Same-tab internal links use client-side navigation, like expo-router.
        const external = /^[a-z][a-z0-9+.-]*:/i.test(url);
        if (external || target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        if (replace) bridgeReplace(url);
        else bridgePush(url);
      }}
    >
      {children}
    </a>
  );
}

export function useNavigation() {
  const pathname = useNextPathname();
  const optionsRef = useRef<Record<string, unknown>>({});
  return useMemo(
    () => ({
      setOptions: (opts: Record<string, unknown>) => {
        optionsRef.current = { ...optionsRef.current, ...opts };
      },
      getOptions: () => optionsRef.current,
      isFocused: () => true,
      addListener: (_event: string, _cb: () => void) => () => {},
      navigate: (href: Href) => bridgePush(href),
      goBack: () => bridgeBack(),
      pathname,
    }),
    [pathname]
  );
}

/* ------------------------------------------------------------------ */
/* Misc types                                                          */
/* ------------------------------------------------------------------ */

export type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

export const UnstableSettings = undefined;
