import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/supabaseClient";
import UserInfoItem from "@/components/UserInfoItem";
import { LogOutIcon, User2Icon } from "lucide-react";

interface NavUserProps {
  isMobile: boolean;
}

function NavUser({ isMobile }: NavUserProps) {
  const { userData: user } = useUser();
  const navigate = useNavigate();

  if (!user) return null;

  const handleSignOut = async () => {
    supabase.auth.signOut();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground space-x-1"
        >
          <UserInfoItem
            firstName={user.firstName}
            lastName={user.lastName}
            pid={user.pid}
            avatarUrl={user.avatarUrl}
            className="w-full bg-transparent"
          />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left">
            <UserInfoItem
              firstName={user.firstName}
              lastName={user.lastName}
              pid={user.pid}
              avatarUrl={user.avatarUrl}
              size="sm"
              className="w-full bg-transparent"
            />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            Profile <User2Icon className="w-4 h-4 ml-auto" />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-red-600 dark:text-red-400"
        >
          Log out <LogOutIcon className="w-4 h-4 ml-auto" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NavUser;
