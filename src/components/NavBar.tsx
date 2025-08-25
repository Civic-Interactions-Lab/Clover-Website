import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { DoorOpen, Menu, User2 } from "lucide-react";
import { UserRole } from "@/types/user";
import { useUser } from "@/context/UserContext";
import UserAvatar from "./UserAvatar";
import { supabase } from "@/supabaseClient";
import CloverLogo from "./CloverLogo";

/**
 * NavBar component that appears at the top of the page.
 * It contains links to different pages and a user avatar dropdown.
 * The component is responsive and adapts to different screen sizes.
 * @returns NavBar component
 */
export const NavBar = () => {
  const { isAuthenticated } = useAuth();
  const { userData } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate("/");
  };

  console.log("User Data:", userData?.settings);

  const navLinks = [
    { to: "/home", label: "Home" },
    ...(isAuthenticated
      ? [
          ...(userData?.settings?.enableDashboard !== false
            ? [{ to: "/dashboard", label: "Dashboard" }]
            : []),
          ...(userData?.role === UserRole.STUDENT
            ? [{ to: "/quiz", label: "Review" }]
            : []),
        ]
      : []),
    { to: "/download", label: "Download" },
    { to: "/about", label: "About" },
  ];

  if (!userData) return null;

  return (
    <nav
      className={`
        flex justify-between items-center py-3 pl-8 pr-4 md:pl-12 md:pr-6 
        fixed w-full top-0 z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md border-b border-gray-200/20 dark:border-gray-700/20 shadow-sm"
            : "bg-white dark:bg-[#0a0a0a]"
        }
      `}
    >
      <div className="flex items-center space-x-4">
        <Link to="/home" className="flex items-center space-x-2 md:space-x-3">
          <CloverLogo size="md" />
        </Link>
      </div>

      <div className="hidden lg:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
        <ul className="flex space-x-12 text-lg items-center ml-8">
          {navLinks.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="hover:text-alpha transition">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden lg:flex items-center space-x-4">
        {isAuthenticated ? (
          <>
            <DropdownAvatar handleSignOut={handleSignOut} />
            <ThemeToggle />
          </>
        ) : (
          <>
            <Link to="/login">
              <Button className="bg-alpha hover:bg-[#468585] text-white font-medium text-md">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="text-[#5AC8A8] hover:bg-gray-200 bg-gray-50 font-medium text-md">
                Sign Up
              </Button>
            </Link>
            <ThemeToggle />
          </>
        )}
      </div>

      <div className="lg:hidden flex items-center space-x-3">
        {isAuthenticated && <DropdownAvatar handleSignOut={handleSignOut} />}
        <ThemeToggle />
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="!h-6 !w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col h-full pt-4">
              <div className="flex-1 flex flex-col items-start gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="w-full py-3 px-4 text-lg hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pb-6 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
                {isAuthenticated ? (
                  <Button
                    onClick={handleSignOut}
                    className="w-full py-4 text-lg bg-orange-700 hover:bg-orange-500 text-white"
                  >
                    Sign Out
                  </Button>
                ) : (
                  <>
                    <Link to="/login">
                      <Button
                        className="w-full py-4 text-lg bg-alpha hover:bg-[#468585] text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button
                        className="mt-4 w-full py-4 text-lg text-alpha hover:bg-gray-200 bg-gray-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default NavBar;

/**
 * DropdownAvatar component that displays the user's avatar and provides a dropdown menu for profile, settings, and sign out options.
 * It is used in the NavBar component for authenticated users.
 * @param props - Props for the DropdownAvatar component
 * @param props.handleSignOut - Function to handle sign out action
 * @returns
 */
export const DropdownAvatar = ({
  handleSignOut,
}: {
  handleSignOut: () => void;
}) => {
  const { userData, loading } = useUser();

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-12 w-12 rounded-full">
          <UserAvatar
            firstName={userData?.firstName}
            avatarUrl={userData?.avatarUrl}
            size="md"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40" align="end" forceMount>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="w-full cursor-pointer py-2">
            <User2 className="h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400 py-2"
        >
          <DoorOpen /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
