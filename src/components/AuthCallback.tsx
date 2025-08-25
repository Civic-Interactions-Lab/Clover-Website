import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { handleAuthRedirect } from "../utils/handleAuth";

/**
 * AuthCallback component handles the authentication callback from Supabase.
 * @returns {JSX.Element} - A React component that handles the authentication callback from Supabase.
 */
export const AuthCallback = () => {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    handleAuthRedirect({
      onComplete: () => {
        navigate("/dashboard");
      },
      onError: (message) => {
        console.error("Web Auth Failed:", message);
        navigate("/login");
      },
    });
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <p>Logging you in...</p>
    </div>
  );
};

export default AuthCallback;
