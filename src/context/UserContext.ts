import { createContext, useContext } from "react";
import { User } from "../types/user";

interface UserContextType {
  userData: User | null;
  loading: boolean;
  error: string | null;
  refetchUser: () => void;
  isPasswordRecovery?: boolean;
}

export const UserContext = createContext<UserContextType | null>(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
