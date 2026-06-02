import { CommandCenterProvider } from "@/shared/providers/command-center-provider";
import { GridBackground } from "@/widgets/command-shell/grid-background";
import "@/app/admin/dashboard/command-center.css";

export default function CommandCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CommandCenterProvider>
      <GridBackground />
      <div className="command-center relative min-h-full text-slate-100">{children}</div>
    </CommandCenterProvider>
  );
}
