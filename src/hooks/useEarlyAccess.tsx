import { createContext, JSX, useContext, useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

const EarlyAccessContext = createContext<{
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}>({
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  isLoading: false,
});

// Provider component
export const EarlyAccessProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const stored = localStorage.getItem("earlyAccessAuth");
      if (stored) {
        try {
          const { authenticated, expiry } = JSON.parse(stored);
          if (authenticated && new Date().getTime() < expiry) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("earlyAccessAuth");
          }
        } catch (error) {
          localStorage.removeItem("earlyAccessAuth");
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    const VALID_CREDENTIALS = {
      username: "admin",
      password: "preview123",
    };

    if (
      username === VALID_CREDENTIALS.username &&
      password === VALID_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);

      // Store session with 24 hour expiry
      const expiry = new Date().getTime() + 24 * 60 * 60 * 1000;
      localStorage.setItem(
        "earlyAccessAuth",
        JSON.stringify({
          authenticated: true,
          expiry,
        })
      );

      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("earlyAccessAuth");
  };

  return (
    <EarlyAccessContext.Provider
      value={{ isAuthenticated, login, logout, isLoading }}
    >
      {children}
    </EarlyAccessContext.Provider>
  );
};

export const useEarlyAccess = () => {
  const context = useContext(EarlyAccessContext);
  if (!context) {
    throw new Error("useEarlyAccess must be used within EarlyAccessProvider");
  }
  return context;
};

export const ConstructionRoute = (): JSX.Element => {
  const { isAuthenticated, isLoading } = useEarlyAccess();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/early-access" replace />;
  }

  return <Outlet />;
};
