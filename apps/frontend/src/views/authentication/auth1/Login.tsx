import { Link, useNavigate } from "react-router"
import { useAuth } from "src/lib/better-auth"
import { useEffect } from "react"
import AuthLogin from "../authforms/AuthLogin"
import LeftSidebarPart from "../LeftSidebarPart"
import LogoIcon from "/src/assets/images/logos/logo.svg"
import { Loading } from 'src/components/ui/loading';


const Login = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('[Login] User already signed in, redirecting to home...');
      navigate("/", { replace: true });
    }
  }, [isLoaded, isSignedIn, navigate]);

  // Show loading while checking auth
  if (!isLoaded) {
    return <Loading fullPage />;
  }

  // Show loading while redirecting
  if (isSignedIn) {
    return <Loading fullPage />;
  }

  return (
    <>
      <div className="relative overflow-hidden h-screen">
        <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-darkgray">
          <div className="xl:col-span-4 lg:col-span-6 col-span-12 sm:px-12 px-4">
            <div className="flex h-screen items-center px-3 lg:justify-start justify-center">
              <div className="max-w-md w-full mx-auto">
                <img src={LogoIcon} alt="Logo" className="h-12 mb-4" />
                <h3 className="text-2xl font-bold my-3 mt-5">Sign In</h3>
                <p className="text-sm font-medium text-gray-500">
                  Your Admin Dashboard
                </p>
                <AuthLogin />
                <div className="flex gap-2 text-base dark:text-white font-medium mt-6 items-center justify-center">
                  <p>New to TrainerHub?</p>
                  <Link
                    to={"/auth/register"}
                    className="text-[#CFA15A] text-sm font-medium hover:underline"
                  >
                    Create an account
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="xl:col-span-8 lg:col-span-6 col-span-12 bg-[#0A2540] dark:bg-dark lg:block hidden relative overflow-hidden">
            <LeftSidebarPart />
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
