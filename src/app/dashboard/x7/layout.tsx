import X7Sidebar from "./X7Sidebar";

export default function X7Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full w-full overflow-hidden">
      <X7Sidebar />
      <div className="flex-1 overflow-hidden relative">{children}</div>
    </div>
  );
}
