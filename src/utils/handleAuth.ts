import { checkAndRegisterUser } from "../api/auth";
import { supabase } from "../lib/supabaseClient.ts";

export async function handleAuthRedirect({
  onComplete,
  onError,
}: {
  onComplete: (userId: string) => void;
  onError?: (message: string) => void;
}) {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (!accessToken || !refreshToken) {
    const msg = "Missing authentication tokens.";
    console.error(msg);
    onError?.(msg);
    return;
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (sessionError) {
    const msg = `Session error: ${sessionError.message}`;
    console.error(msg);
    onError?.(msg);
    return;
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    const msg = `User fetch error: ${userError?.message}`;
    console.error(msg);
    onError?.(msg);
    return;
  }

  const user = userData.user;
  const userId = user.id;
  const email = user.email;
  const fullName = user.user_metadata?.full_name || "";
  const [firstName, ...rest] = fullName.trim().split(" ");
  const lastName = rest.join(" ");

  if (!firstName || !lastName || !email) {
    const msg = "User metadata is incomplete.";
    console.error(msg);
    onError?.(msg);
    return;
  }

  const { error } = await checkAndRegisterUser(
    firstName,
    lastName,
    email,
    userId,
  );
  if (error) {
    const msg = `Error checking/registering user: ${error}`;
    console.error(msg);
    onError?.(msg);
    return;
  }

  onComplete(userId);
}
