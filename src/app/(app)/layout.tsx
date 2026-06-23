import { AppShell } from "@/components/app-shell";
import { SyncProvider } from "@/components/sync-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SyncProvider>
      <AppShell>{children}</AppShell>
    </SyncProvider>
  );
}
