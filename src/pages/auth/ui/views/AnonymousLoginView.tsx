import { registerUser } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/supabaseClient";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { generateSlug } from "random-word-slugs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dice1, Dices } from "lucide-react";
import ConsentFormViewCheck from "../components/ConsentFormViewCheck";

const ANONYMOUS_PASSWORD = import.meta.env.VITE_ANONYMOUS_SHARED_PASSWORD;

const AnonymousLoginView = () => {
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
      categories: {
        noun: ["animals"],
      },
    });
    setUsername(newUsername);
    setError("");
  };

  const checkUsernameExists = async (
    usernameToCheck: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("first_name")
        .eq("first_name", usernameToCheck)
        .limit(1);

      if (error) {
        console.error("Error checking username:", error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error("Username check error:", err);
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError("Please enter a username or generate one");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const usernameExists = await checkUsernameExists(username.trim());

      if (usernameExists) {
        setError(
          "This username is already taken. Please choose a different one or generate a new one."
        );
        setLoading(false);
        return;
      }

      const email = `${username.trim().toLowerCase()}@anonymous.com`;

      // Register through your existing API function
      const registerResult = await registerUser(
        username.trim(),
        "",
        email,
        ANONYMOUS_PASSWORD,
        isConsent
      );

      if (registerResult.error) {
        setError(registerResult.error);
        return;
      }

      // Sign in the newly created user
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email,
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

  // Generate initial username on component mount
  React.useEffect(() => {
    generateRandomUsername();
  }, []);

  const handleConsentChange = (consented: boolean) => {
    setIsConsent(consented);
  };

  const handleConsentViewed = (hasViewed: boolean) => {
    setHasViewedConsent(hasViewed);
  };

  return (
    <div className="flex flex-col justify-center items-center w-full text-text h-[calc(100vh-12rem)]">
      <Card className="p-8 w-full max-w-md">
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
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Choose your username:
            </label>
            <Input
              type="text"
              placeholder="e.g. happy-dolphin"
              value={username}
              onChange={handleUsernameChange}
              className="w-full text-center text-lg font-mono bg-gray-900 border-gray-600 text-white placeholder-gray-400 py-6"
              disabled={loading}
            />
          </div>

          <Button
            onClick={generateRandomUsername}
            disabled={loading}
            variant="outline"
            className="w-full border border-gray-400 py-6 text-md"
          >
            <Dices className="inline-block" /> Generate New Username
          </Button>

          <div className="h-6" />

          {/* Consent Checkbox Component */}
          <ConsentFormViewCheck
            isConsent={isConsent}
            onConsentChange={handleConsentChange}
            onConsentViewed={handleConsentViewed}
            showViewButton={true}
            disabled={loading}
          />

          <Button
            onClick={handleSubmit}
            disabled={
              !username.trim() ||
              username.trim().length < 6 ||
              loading ||
              !hasViewedConsent
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-6 text-md"
          >
            {loading ? "Creating Account..." : "Create Anonymous Account"}
          </Button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-primary hover:text-primary/80 hover:underline"
          >
            ← Back to Login
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          <p>
            Anonymous accounts allow you to use Clover without providing
            personal information.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AnonymousLoginView;
