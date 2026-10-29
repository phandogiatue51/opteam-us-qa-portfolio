import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";

/** Wraps protected pages with sidebar + header */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b border-border dark:border-emerald-500/10 bg-card px-6">
          <SidebarTrigger />
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-auto bg-background bg-grid p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppLayout;
