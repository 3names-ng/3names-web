// Client root for the Next.js app: registers the expo-router bridge (so the
// module-level `router` export can navigate) and mounts the original root
// layout from screens/_layout.tsx around the matched route.
"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import "./app-frame";
import { RouteContentProvider, useRouterBridge } from "expo-router";

const RootLayout = dynamic(() => import("@/screens/_layout"), { ssr: false });

export default function RootShell({ children }: { children: ReactNode }) {
  useRouterBridge();
  return (
    <div id="root">
      <RouteContentProvider value={children}>
        <RootLayout />
      </RouteContentProvider>
    </div>
  );
}
