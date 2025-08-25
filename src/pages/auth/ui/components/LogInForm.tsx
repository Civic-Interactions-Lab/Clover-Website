import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, VenetianMask } from "lucide-react";
import { supabase } from "@/supabaseClient";
import { AUTH_ENDPOINT } from "@/api/endpoints";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * LoginForm component for user authentication.
 * It allows users to log in using email and password or GitHub OAuth.
 * @returns LoginForm component for user authentication.
 */
export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle GitHub Login
  const handleGitHubLogin = async () => {
    try {
      window.location.href = `${AUTH_ENDPOINT}/provider/github?redirect_to=https://clover.nickrucinski.com/auth`; // Redirect user to GitHub OAuth
      // window.location.href = `${AUTH_ENDPOINT}/provider/github?redirect_to=http://localhost:5173/auth`; // Redirect user to GitHub OAuth
    } catch (err) {
      setError("An error occurred while attempting GitHub login." + err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Invalid email or password.");
        return;
      }

      if (!data.user) {
        navigate("/signup");
      } else {
        toast.success("Logged in successfully!");
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-8 w-96">
      <h2 className="text-2xl font-bold text-center mb-6">Log In to CLOVER</h2>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Email + Password Login */}
      <form onSubmit={handleLogin} className="flex flex-col gap-6">
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
            onChange={(e) => setPassword(e.target.value)}
            value={password}
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
        <Button type="submit" className="w-full text-text py-5 mt-6 text-md">
          {loading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* GitHub OAuth Login */}
      <Button
        onClick={handleGitHubLogin}
        className="mt-4 text-md w-full bg-gray-700 text-white dark:text-white py-5 hover:bg-gray-600 transition flex items-center justify-center space-x-2"
      >
        <img
          src="https://img.icons8.com/?size=100&id=62856&format=png&color=FFFFFF"
          alt="GitHub Logo"
          className="h-5 w-5"
        />
        <span>Sign in with GitHub</span>
      </Button>

      <Button
        onClick={() => navigate("/anonymous")}
        variant="outline"
        className="mt-4 text-md w-full py-5"
      >
        <VenetianMask className="h-5 w-5 mr-2" />
        <span>Sign in Anonymously</span>
      </Button>

      <p className="mt-4 text-center text-text">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="text-primary hover:underline"
        >
          Sign Up
        </button>
      </p>
      <p className="mt-4 text-center text-text">
        <button
          onClick={() => navigate("/passwordreset")}
          className="text-primary hover:underline"
        >
          Forgot your password?
        </button>
      </p>
    </Card>
  );
};

export default LoginForm;
