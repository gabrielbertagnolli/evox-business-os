"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-restricted-syntax */

import { ReactNode, useState, useEffect } from "react";
import X7Sidebar from "./X7Sidebar";

export default function X7Layout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("x7_sidebar_collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex h-full min-h-0 opacity-0" />;
  }

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] min-h-0 bg-[#0e101a] overflow-hidden">
      <X7Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      <main className="flex-1 min-w-0 bg-[#0e101a] h-full flex flex-col relative z-0">
        <div className="absolute inset-0 overflow-y-auto w-full h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
