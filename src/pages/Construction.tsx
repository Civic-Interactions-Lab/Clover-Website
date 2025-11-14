import { Eye, EyeOff, Lock, Rocket, User, Wrench } from "lucide-react";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useEarlyAccess } from "@/hooks/useEarlyAccess";
import { Navigate } from "react-router-dom";

const Construction = () => {
  const { isAuthenticated, login, isLoading: authLoading } = useEarlyAccess();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const success = await login(username, password);
      if (!success) {
        setError("Invalid username or password");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animated background particles
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="absolute w-2 h-2 bg-blue-400/20 rounded-full animate-bounce"
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        {particles}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-400/10 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute bottom-20 right-20 w-48 h-48 bg-purple-400/10 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main Construction Message */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Wrench className="w-24 h-24 text-blue-600 animate-bounce" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping" />
              </div>
            </div>

            <h1 className="text-4xl p-2 md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              We're Building Something Amazing
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Our website is under construction, but we're working hard to bring
              you an incredible experience.
            </p>
          </div>

          {/* Launch Estimate */}
          <Card className="p-6 bg-gray-100 border-none max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Rocket className="w-6 h-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Expected Launch
              </h3>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-2">
              Soon™
            </div>
            <p className="text-sm text-gray-600">
              We're putting the finishing touches on something special
            </p>
          </Card>

          {/* Access Button */}
          {!showLogin ? (
            <div className="space-y-4">
              <Button
                onClick={() => setShowLogin(true)}
                className="px-8 py-3 text-lg bg-purple-600 hover:bg-purple-700"
              >
                <Lock className="w-5 h-5 mr-2" />
                Early Access Login
              </Button>
              <p className="text-sm text-gray-500">
                Have early access credentials? Click above to continue.
              </p>
            </div>
          ) : (
            <Card className="p-8 max-w-md mx-auto bg-gray-100 border-none">
              <form>
                <div className="space-y-6">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800">
                      Early Access
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Enter your credentials to continue
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-gray-600" htmlFor="username">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="pl-10 text-black"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-600" htmlFor="password">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 text-black"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        onClick={handleLogin}
                        type="submit"
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700"
                        disabled={isLoading}
                      >
                        {isLoading ? "Authenticating..." : "Access Website"}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => setShowLogin(false)}
                        className="w-full text-black"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{" "}
              <a
                href="mailto:nicholas.rucinski@temple.edu"
                className="text-blue-600 hover:underline"
              >
                nicholas.rucinski@temple.edu
              </a>
            </p>
            <p className="text-xs text-gray-400">
              © 2025 Team 2. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Construction;
