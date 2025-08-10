import NavBar from "@/components/NavBar";
import LoginForm from "@/pages/auth/ui/components/LogInForm";

/**
 * LogIn component that renders the login form.
 * @returns {JSX.Element} The LogIn component.
 */
export const LogInView = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full text-text flex-1">
      <LoginForm />
    </div>
  );
};
export default LogInView;
