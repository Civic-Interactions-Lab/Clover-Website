import { useRef, useState } from "react";
import { UserRole } from "@/types/user";
import DashboardSidebar from "@/pages/dashboard/ui/components/DashboardSidebar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { sidebarItems } from "@/constants/sidebarConfigs";
import DashboardHeader from "@/pages/dashboard/ui/components/DashboardHeader";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

const Dashboard = () => {
  const { userData, loading } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.split("/dashboard/")[1] || "user-stats";
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const effectiveRole = selectedRole ?? userData?.role;

  const handleTabClick = (tabId: string) => {
    navigate(`/dashboard/${tabId}`);
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    const firstTab = sidebarItems.find((item) => item.roles.includes(role))?.id;
    if (firstTab) {
      navigate(`/dashboard/${firstTab}`);
    }
  };

  const currentSidebarItem = sidebarItems.find(
    (item) => item.id === currentTab
  );
  const ActiveComponentView = currentSidebarItem?.dashboardView;
  const title = currentSidebarItem?.title || "Dashboard";
  const description =
    currentSidebarItem?.description || "Welcome to your dashboard";
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DashboardSidebar
          sidebarItems={sidebarItems}
          effectiveRole={effectiveRole as UserRole}
          currentTab={currentTab}
          onTabClick={handleTabClick}
          onRoleChange={handleRoleChange}
          userRole={userData?.role}
        />
        <main
          ref={scrollRef}
          className="flex-1 bg-background/80 dark:bg-[#0a0a0a] overflow-auto"
        >
          <DashboardHeader title={title} role={effectiveRole} />
          <div className="w-full max-w-7xl mx-auto px-6">
            {ActiveComponentView ? (
              <ActiveComponentView description={description} />
            ) : (
              <Outlet context={{ scrollRef }} />
            )}
          </div>
          <div className="h-32" />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
