import { supabase } from "@/supabaseClient";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AtSign,
  Check,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  LockKeyhole,
} from "lucide-react";
import { toast } from "sonner";
import { RESET_PASSWORD_REDIRECT } from "@/api/endpoints";
import { useNavigate } from "react-router-dom";

/**
 * PasswordReset component.
 * It allows the user to reset their password.
 * @returns PasswordReset component.
 */
export const PasswordResetForm = () => {
  const [email, setEmail] = useState("");
  const [submit, setSubmit] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmit("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: RESET_PASSWORD_REDIRECT,
      });

      if (error) {
        console.error("Password reset error:", error);
        setError(
          error.message || "Failed to send reset email. Please try again."
        );
        return;
      }

      setSubmit("Please check your email to confirm");
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-6">
          <LogoIcon icon={<KeyRound className="text-white" />} />
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Enter your email to receive a password reset link
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Messages */}
          {submit && (
            <Alert className="border-primary/20 bg-primary/5">
              <Check className="size-4 !text-primary" />
              <AlertDescription className="text-primary font-medium mt-1">
                {submit}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="bg-destructive/5">
              <Info className="size-4" />
              <AlertDescription className="font-medium mt-1">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <AtSign className="size-4 text-muted-foreground" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-11 transition-all duration-200 focus:ring-2 focus:ring-[#50B498]/20"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <SubmitButton
              isLoading={isLoading}
              loadingText="Sending Reset Link..."
            >
              Send Reset Link
            </SubmitButton>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <a
                href="/login"
                className="text-[#50B498] hover:text-[#468585] font-medium transition-colors hover:underline"
              >
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordResetForm;

export const PasswordResetCallback = () => {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [canReset, setCanReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    // Check if user is already in PASSWORD_RECOVERY state
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setCanReset(true);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setCanReset(true);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    // Calculate password strength
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError("Failed to reset password");
      } else {
        toast.success("Password reset successful!");
        await supabase.auth.signOut();
        navigate("/login", {
          state: {
            message:
              "Password updated successfully. Please sign in with your new password.",
          },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      navigate("/login");
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return "bg-red-500";
    if (passwordStrength <= 50) return "bg-yellow-500";
    if (passwordStrength <= 75) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 25) return "Weak";
    if (passwordStrength <= 50) return "Fair";
    if (passwordStrength <= 75) return "Good";
    return "Strong";
  };

  if (!canReset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#50B498] mb-4"></div>
            <p className="text-muted-foreground">Verifying reset token...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 text-center pb-6">
          <LogoIcon icon={<LockKeyhole className="text-white" />} />
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Create New Password
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Choose a strong password for your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="bg-destructive/5">
              <Info className="size-4" />
              <AlertDescription className="font-medium mt-1">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-[#50B498]/20"
                  required
                  disabled={isLoading}
                />
                <PasswordToggle
                  showPassword={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-medium ${passwordStrength <= 25 ? "text-red-600" : passwordStrength <= 50 ? "text-yellow-600" : passwordStrength <= 75 ? "text-blue-600" : "text-green-600"}`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10 h-11 transition-all duration-200 focus:ring-2 focus:ring-[#50B498]/20"
                  required
                  disabled={isLoading}
                />
                <PasswordToggle
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
            </div>

            <SubmitButton
              isLoading={isLoading}
              loadingText="Updating Password..."
            >
              Update Password
            </SubmitButton>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              <button
                onClick={handleBackToLogin}
                className="text-[#50B498] hover:text-[#468585] font-medium transition-colors hover:underline bg-transparent border-none cursor-pointer"
                disabled={isLoading}
              >
                Back to Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface LogoIconProps {
  icon: React.ReactNode;
}

const LogoIcon = ({ icon }: LogoIconProps) => (
  <div className="w-16 h-16 bg-gradient-to-br from-[#50B498] to-[#468585] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
    {icon}
  </div>
);

interface PasswordToggleProps {
  showPassword: boolean;
  onToggle: () => void;
}

const PasswordToggle = ({ showPassword, onToggle }: PasswordToggleProps) => (
  <Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={onToggle}
    className="absolute inset-y-0 right-0 pt-3 pr-3 flex items-center hover:bg-transparent text-muted-foreground"
  >
    {showPassword ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
  </Button>
);

interface SubmitButtonProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const SubmitButton = ({
  isLoading,
  loadingText,
  children,
  disabled = false,
}: SubmitButtonProps) => (
  <Button
    type="submit"
    disabled={isLoading || disabled}
    className="w-full h-11 bg-gradient-to-r from-[#50B498] to-[#468585] hover:from-[#468585] hover:to-[#3a6b6b] text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
  >
    {isLoading ? (
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="size-4 animate-spin" />
        {loadingText}
      </div>
    ) : (
      children
    )}
  </Button>
);
