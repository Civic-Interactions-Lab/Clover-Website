import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { UserRole } from "@/types/user";
import { ROLE_SELECT_CONFIG, SideBarItem } from "@/constants/sidebarConfigs";
import { Label } from "@/components/ui/label";
import { Download, FileQuestion } from "lucide-react";
import NavUser from "./NavUser";
import CloverLogo from "@/components/CloverLogo";

interface DashboardSidebarProps {
  sidebarItems: SideBarItem[];
  effectiveRole: UserRole;
  currentTab: string;
  onTabClick: (tab: string) => void;
  onRoleChange: (role: UserRole) => void;
  userRole?: UserRole;
}

const DashboardSidebar = ({
  sidebarItems,
  effectiveRole,
  currentTab,
  onTabClick,
  onRoleChange,
  userRole = UserRole.STUDENT,
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();

  const visibleItems = sidebarItems.filter((item) =>
    item.roles.includes(effectiveRole)
  );

  const selectableRoles = ROLE_SELECT_CONFIG[userRole];

  const groupedItems = visibleItems.reduce<Record<string, typeof sidebarItems>>(
    (groups, item) => {
      const group = item.subheading || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
      return groups;
    },
    {}
  );

  const handleTabClick = (id: string) => {
    onTabClick(id);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="!p-1 !m-1.5">
              <a href="/home">
                <CloverLogo />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {Object.entries(groupedItems).map(([subheading, items]) => (
          <SidebarGroup key={subheading}>
            <SidebarGroupLabel>{subheading}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map(({ id, icon: Icon, name }) => (
                  <SidebarMenuItem key={id}>
                    <SidebarMenuButton
                      onClick={() => handleTabClick(id)}
                      isActive={currentTab === id}
                    >
                      <Icon />
                      <span>{name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="pb-4">
        {onRoleChange && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground px-1.5">
              Viewing as
            </Label>
            <Select
              value={effectiveRole}
              onValueChange={(value) => onRoleChange(value as UserRole)}
            >
              <SelectTrigger className="w-full text-sm bg-background">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role[0] + role.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <SidebarGroup className="mb-2">
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/download")}
                  className="w-full text-left"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() =>
                    window.open(
                      "https://civic-interactions-lab.github.io/clover/",
                      "_blank"
                    )
                  }
                  className="w-full text-left"
                >
                  <FileQuestion className="h-4 w-4" />
                  <span>Docs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground space-x-1"
              asChild
            >
              <NavUser isMobile={isMobile} />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
