import { anonymousAuth } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabaseClient.ts";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateSlug } from "random-word-slugs";
import { Label } from "@/components/ui/label";
import { Dices, LogIn, UserPlus } from "lucide-react";
import ConsentFormViewCheck from "../components/ConsentFormViewCheck";

const ANONYMOUS_PASSWORD = import.meta.env.VITE_ANONYMOUS_SHARED_PASSWORD;

const AnonymousLoginView = () => {
  const [mode, setMode] = useState("signin");
  const [username, setUsername] = useState("");
  const [isConsent, setIsConsent] = useState(false);
  const [hasViewedConsent, setHasViewedConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const generateRandomUsername = (): void => {
    const newUsername = generateSlug(2, {
      format: "kebab",
      partsOfSpeech: ["adjective", "noun"],
      categories: { noun: ["animals"] },
    });
    setUsername(newUsername);
    setError("");
  };

  const handleSignIn = async () => {
    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await anonymousAuth("signin", username);
      if (result.error) {
        setError(
          "No account found with this username. Try creating a new one.",
        );
        return;
      }

      const email = `${username.trim().toLowerCase()}@anonymous.com`;
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: ANONYMOUS_PASSWORD,
        });

      if (signInError) {
        setError(
          "No account found with this username. Try creating a new one.",
        );
        return;
      }

      if (data) {
        toast.success("Signed in anonymously!");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Anonymous sign in error:", err);
      setError("Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!username.trim()) {
      setError("Please enter a username or generate one");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await anonymousAuth("signup", username, isConsent);
      if (result.error) {
        setError(result.error);
        return;
      }

      const email = `${username.trim().toLowerCase()}@anonymous.com`;
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: ANONYMOUS_PASSWORD,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (data) {
        toast.success("Anonymous account created successfully!");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Create anonymous account error:", err);
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(value);
    setError("");
  };

  const handleTabChange = (newMode: string) => {
    setMode(newMode as "signin" | "signup");
    setError("");
    setUsername("");
    setIsConsent(false);
    setHasViewedConsent(false);
    if (newMode === "signup") {
      setTimeout(() => generateRandomUsername(), 0);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center w-full text-text flex-1">
      <Card className="p-8 w-full max-w-md">
        <Tabs value={mode} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn size={16} />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex items-center gap-2">
              <UserPlus size={16} />
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-0">
            <h2 className="text-2xl font-bold text-center mb-6">
              Sign In Anonymous
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Enter your username:
                </Label>
                <Input
                  type="text"
                  placeholder="your-username"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full text-center text-lg font-mono border-gray-600 placeholder-gray-400 py-6"
                  disabled={loading}
                />
              </div>

              <Button
                onClick={handleSignIn}
                disabled={
                  !username.trim() || username.trim().length < 6 || loading
                }
                className="w-full disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-6 text-md"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Anonymous accounts allow you to use Clover without providing
                  personal information.
                </li>
                <li>
                  Enter the username you used when creating your anonymous
                  account.
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="signup" className="mt-0">
            <h2 className="text-2xl font-bold text-center mb-6">
              Create Anonymous Account
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-600/20 border border-red-600/30 rounded text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Choose your username:
                </Label>
                <Input
                  type="text"
                  placeholder="e.g. happy-dolphin"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full text-center text-lg font-mono border-gray-600 placeholder-gray-400 py-6"
                  disabled={loading}
                />
              </div>

              <Button
                onClick={generateRandomUsername}
                disabled={loading}
                variant="outline"
                className="w-full border py-6 text-md"
              >
                <Dices className="inline-block" /> Generate New Username
              </Button>

              <div className="h-6" />

              <ConsentFormViewCheck
                isConsent={isConsent}
                onConsentChange={setIsConsent}
                onConsentViewed={setHasViewedConsent}
                showViewButton={true}
                disabled={loading}
              />

              <Button
                onClick={handleSignUp}
                disabled={
                  !username.trim() ||
                  username.trim().length < 6 ||
                  loading ||
                  !hasViewedConsent
                }
                className="w-full disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-6 text-md"
              >
                {loading ? "Creating Account..." : "Create Anonymous Account"}
              </Button>
            </div>

            <div className="mt-4 text-xs text-gray-400">
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Anonymous accounts allow you to use Clover without providing
                  personal information.
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:text-primary/80 hover:underline"
          >
            ← Back to Login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AnonymousLoginView;
