import NavBar from "@/components/NavBar";
import SignUpForm from "@/pages/auth/ui/components/SignUpForm";

/**
 * SignUp component that renders the sign-up form.
 * @returns SignUp component that displays the sign-up form.
 */
export const SignUpView = () => {
  return (
    <div className="flex flex-col justify-center items-center flex-1 text-text">
      <SignUpForm />
    </div>
  );
};
export default SignUpView;
