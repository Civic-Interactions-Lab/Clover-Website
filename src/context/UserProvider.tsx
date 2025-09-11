import { useEffect, useState } from "react";
import { User } from "../types/user";
import { useAuth } from "../hooks/useAuth";
import { getUserData } from "../api/user";
import { UserContext } from "./UserContext";
import { supabase } from "@/supabaseClient";

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Check for password recovery state and handle route protection
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsPasswordRecovery(true);
          // Check if user is on the correct reset page
          if (window.location.pathname !== "/reset-form") {
            // If they're not on reset page, sign them out
            console.log(
              "Password recovery detected on wrong page, signing out..."
            );
            await supabase.auth.signOut();
          }
        } else if (event === "SIGNED_OUT") {
          setIsPasswordRecovery(false);
        } else if (event === "SIGNED_IN") {
          setIsPasswordRecovery(false);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchUserData = async () => {
    if (!isAuthenticated || !user || isPasswordRecovery) {
      setUserData(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await getUserData(user.id);

      if (fetchError) {
        throw new Error(fetchError);
      }

      setUserData(data || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch user data";
      setError(errorMessage);
      console.error("Failed to fetch user:", err);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const refetchUser = () => {
    fetchUserData();
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        error,
        refetchUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
