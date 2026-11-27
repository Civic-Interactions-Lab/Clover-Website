import { useEffect, useRef } from "react";
import { handleAuthRedirect } from "../utils/handleAuth";
import { createExtensionAPISession } from "../api/auth";

export default function VSCodeAuthCallback() {
  const called = useRef(false);
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    handleAuthRedirect({
      onComplete: async (userId, accessToken) => {
        const { apiToken, error } = await createExtensionAPISession(accessToken);
        if (error || !apiToken) {
          console.error("VSCode API session failed:", error);
          return;
        }
        window.location.href = `vscode://capstone-team-2.tu-clover/auth-complete?id=${encodeURIComponent(userId)}&apiToken=${encodeURIComponent(apiToken)}`;
      },
      onError: (message) => {
        console.error("VSCode Auth Failed:", message);
      },
    });
  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
      <p>Logging you in...</p>
    </div>
  );
}
