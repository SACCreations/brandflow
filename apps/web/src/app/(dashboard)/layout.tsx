import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AuthGuard } from '@/components/auth-guard';
import { GlobalCommandPalette } from '@/components/layout/global-command-palette';
import { ScopeSwitcher } from '@/components/layout/scope-switcher';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <ScopeSwitcher />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <GlobalCommandPalette />
      </div>
    </AuthGuard>
  );
}
