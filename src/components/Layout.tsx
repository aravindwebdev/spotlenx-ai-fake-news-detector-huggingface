import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { PageLoader } from "@/components/ui/loading-spinner";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <PageLoader />;
  }

  // For unauthenticated users, show only the navbar
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>{children}</main>
      </div>
    );
  }

  // For authenticated users, show sidebar layout on desktop and mobile-friendly navigation
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full overflow-hidden">
        {/* Sidebar only for mobile screens */}
        <div className="md:hidden">
          <AppSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Desktop navbar - hidden on mobile */}
          <div className="hidden md:block">
            <Navbar />
          </div>
          
          {/* Mobile header with sidebar trigger */}
          <header className="md:hidden border-b bg-background sticky top-0 z-50 w-full">
            <div className="flex items-center justify-between p-4 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile sidebar trigger */}
                <SidebarTrigger className="flex-shrink-0" />
                
                {/* Mobile app title */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl font-bold truncate">SpotLens</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 w-full min-w-0 overflow-x-hidden">
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}