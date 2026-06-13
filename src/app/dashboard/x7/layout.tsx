"use client";

import { useState, useEffect } from "react";
import X7Sidebar from "./X7Sidebar";

export default function X7Layout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("x7_sidebar_collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
    setMounted(true);
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("x7_sidebar_collapsed", String(newState));
  };

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <X7Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} />
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
}
