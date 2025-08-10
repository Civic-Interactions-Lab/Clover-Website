import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { registerUser } from "@/api/auth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ConsentFormViewCheck from "./ConsentFormViewCheck";

/**
 * SignUpForm component for user registration.
 * It allows users to create an account using email and password.
 * TODO: Add GitHub OAuth signup option.
 * @returns SignUpForm component for user registration.
 */
const SignUpForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isConsent, setIsConsent] = useState(false);
  const [hasViewedConsent, setHasViewedConsent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await registerUser(
        firstName,
        lastName,
        email,
        password,
        isConsent
      );

      if (error) {
        setError(error);
        return;
      }

      const data = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (data.error) {
        setError(data.error.message);
        return;
      }

      if (data) {
        toast.success("Account created successfully!");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Sign-up error:", err);
      setError("Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (consented: boolean) => {
    setIsConsent(consented);
  };

  const handleConsentViewed = (hasViewed: boolean) => {
    setHasViewedConsent(hasViewed);
  };

  return (
    <>
      <Card className="p-8 w-96">
        <h2 className="text-2xl font-bold text-center mb-6">
          Create Your Clover Account
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSignUp} className="flex flex-col gap-6">
          <Input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full border py-6 border-gray-400 dark:border-gray-600 rounded dark:bg-gray-700 text-black dark:text-white bg-gray-100 pr-12"
            required
          />
          <Input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full border py-6 border-gray-400 dark:border-gray-600 rounded dark:bg-gray-700 text-black dark:text-white bg-gray-100 pr-12"
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border py-6 border-gray-400 dark:border-gray-600 rounded dark:bg-gray-700 text-black dark:text-white bg-gray-100 pr-12"
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border py-6 border-gray-400 dark:border-gray-600 rounded dark:bg-gray-700 text-black dark:text-white bg-gray-100 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-6 transform -translate-y-1/2 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {/* Consent Checkbox */}
          <ConsentFormViewCheck
            isConsent={isConsent}
            onConsentChange={handleConsentChange}
            onConsentViewed={handleConsentViewed}
            showViewButton={true}
          />

          <Button
            type="submit"
            disabled={!hasViewedConsent || loading}
            className="w-full text-md py-5 mt-3"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>

          <p className="text-center text-text">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:underline"
            >
              Log In
            </button>
          </p>
        </form>
      </Card>
    </>
  );
};

export default SignUpForm;
