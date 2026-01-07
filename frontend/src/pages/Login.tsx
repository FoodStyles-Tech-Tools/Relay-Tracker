import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Radio, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/Loading";

export function LoginPage() {
  const { signIn, loginAsGuest, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (response: CredentialResponse) => {
    setError(null);

    if (!response.credential) {
      setError("No credential received from Google");
      return;
    }

    try {
      await signIn(response.credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  const handleError = () => {
    setError("Google sign-in failed. Please try again.");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-relay-gradient rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-relay-gradient rounded-full opacity-20 blur-3xl" />
      </div>

      {/* Login card */}
      <div className="relative w-full max-w-md">
        <div className="glassmorphism dark:glassmorphism-dark rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-relay-gradient shadow-lg mb-4">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-relay-gradient">Relay</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-center">
              Fast track from report to resolution
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Google Sign in button */}
          <div className="flex flex-col items-center gap-4">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
              use_fedcm_for_prompt={false}
              theme="outline"
              size="large"
              width="320"
              text="signin_with"
              shape="rectangular"
            />

            {import.meta.env.MODE === "development" && (
              <button
                onClick={loginAsGuest}
                className="text-xs text-gray-400 hover:text-relay-orange transition-colors underline decoration-dotted underline-offset-4"
              >
                Dev: Bypass Google Login
              </button>
            )}
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            By signing in, you agree to access Relay with your company
            credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
