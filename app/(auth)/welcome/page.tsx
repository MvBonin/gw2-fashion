"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isWelcomeComplete } from "@/lib/utils/welcome";
import type { Database } from "@/types/database.types";

type UserRow = Database["public"]["Tables"]["users"]["Row"];
type Step = 0 | 1 | 2 | 3;

export default function WelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: Terms accepted (required before proceeding)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [profile, setProfile] = useState<UserRow | null>(null);

  // Step 1: Username
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);

  // Step 2: GW2 API Key (optional)
  const [gw2ApiKey, setGw2ApiKey] = useState("");
  const [gw2AccountName, setGw2AccountName] = useState<string | null>(null);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  // Step 3: Visibility
  const [gw2AccountNamePublic, setGw2AccountNamePublic] = useState(true);

  // Check if user is authenticated and has completed welcome
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check if user has already completed welcome
      const { data, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const profileData = data as UserRow | null;
      setProfile(profileData);

      // If profile exists and welcome is complete (username set + ToS accepted), redirect
      if (profileData && isWelcomeComplete(profileData)) {
        router.push("/");
        return;
      }
      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error checking welcome status:", profileError);
      }
    };
    checkAuth();
  }, [router]);

  // Username validation with debounce
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      setUsernameValid(false);
      setUsernameError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true);
      setUsernameError(null);

      try {
        const response = await fetch("/api/welcome/validate-username", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });

        const data = await response.json();

        if (response.ok && data.available) {
          setUsernameValid(true);
          setUsernameError(null);
        } else {
          setUsernameValid(false);
          setUsernameError(data.error || "Username is not available");
        }
      } catch (err) {
        setUsernameValid(false);
        setUsernameError("Error checking username availability");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleValidateGw2Key = async () => {
    if (!gw2ApiKey.trim()) {
      setKeyError("Please enter an API key");
      return;
    }

    setIsValidatingKey(true);
    setKeyError(null);

    try {
      const response = await fetch("/api/welcome/validate-gw2-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: gw2ApiKey }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setGw2AccountName(data.accountName);
        setKeyError(null);
        setCurrentStep(3);
      } else {
        setKeyError(data.error || "Failed to validate API key");
        setGw2AccountName(null);
      }
    } catch (err) {
      setKeyError("Error validating API key");
      setGw2AccountName(null);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleComplete = async () => {
    if (!usernameValid) {
      setError("Please enter a valid username");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/welcome/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          gw2ApiKey: gw2ApiKey.trim() || null,
          gw2AccountName: gw2AccountName || null,
          gw2AccountNamePublic: gw2AccountName ? gw2AccountNamePublic : false,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse response as JSON:", jsonError);
        setError("Unexpected response from server");
        return;
      }

      if (response.ok && data.success) {
        // Use replace instead of push to avoid back button issues
        // Small delay to ensure state is updated
        setTimeout(() => {
          router.replace("/");
        }, 100);
      } else {
        const errorMessage = data?.error || `Failed to complete welcome (${response.status})`;
        const errorDetails = data?.details ? `: ${data.details}` : "";
        setError(`${errorMessage}${errorDetails}`);
        console.error("Welcome completion error:", {
          error: errorMessage,
          details: data?.details,
          status: response.status,
          fullData: data,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error completing welcome";
      setError(errorMessage);
      console.error("Welcome completion exception:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!usernameValid) {
        setUsernameError("Please enter a valid username");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // If API key was validated, go to visibility step
      if (gw2AccountName) {
        setCurrentStep(3);
      } else {
        // If no API key or key not validated, complete welcome directly
        // (API key is optional, so user can proceed even if validation failed)
        await handleComplete();
      }
    }
  };

  const handleAcceptTerms = async () => {
    // User already has username but never accepted ToS (e.g. legacy account)
    if (profile?.username_manually_set && profile?.terms_accepted_at == null) {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/welcome/accept-terms", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          router.replace("/");
          return;
        }
        setError(data?.error || "Failed to save. Please try again.");
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setTermsAccepted(true);
    setCurrentStep(1);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl mb-2">Welcome to GW2 Fashion!</h1>
          <p className="text-base-content/70 mb-6">
            Let's set up your profile to get started
          </p>

          {/* Progress Indicator */}
          <div className="steps steps-horizontal w-full mb-8">
            <div className={`step ${currentStep >= 0 ? "step-primary" : ""}`}>
              Terms
            </div>
            <div className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
              Username
            </div>
            <div className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
              GW2 API Key
            </div>
            <div className={`step ${currentStep >= 3 ? "step-primary" : ""}`}>
              Visibility
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {/* Step 0: Terms of Use */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Terms of Use</h2>
              <p className="text-base-content/80">
                By continuing, you accept our{" "}
                <Link
                  href="/legal#terms-of-service"
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal#privacy-policy"
                  className="link link-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </Link>
                , including the use of Umami analytics (anonymised, no consent
                required) as described there.
              </p>
              <p className="text-base-content/80">
                You also confirm that you will not upload or share content that
                is hateful, discriminatory, or illegal, and that any images you
                use (e.g. in templates) are your own or used with proper rights.
                Violations may lead to content removal and account restrictions.
              </p>
              <p className="text-sm text-base-content/70">
                This site uses Guild Wars 2 content under{" "}
                <Link
                  href="https://www.arena.net/en/legal/content-terms-of-use"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary"
                >
                  ArenaNet&apos;s Content Use Policy
                </Link>
                .
              </p>
              <div className="card-actions justify-end mt-6">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAcceptTerms}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner" />
                      Saving...
                    </>
                  ) : (
                    "I Accept"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Username */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    What's your username? <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="Enter username"
                  className={`input input-bordered w-full ${
                    usernameError ? "input-error" : usernameValid ? "input-success" : ""
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isCheckingUsername}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    {isCheckingUsername
                      ? "Checking availability..."
                      : usernameError
                      ? usernameError
                      : usernameValid
                      ? "Username is available!"
                      : "3-50 characters, letters, numbers, underscores, and hyphens only"}
                  </span>
                </label>
              </div>
              <p className="text-sm text-base-content/60">
                This username will be permanent and cannot be changed later.
              </p>
            </div>
          )}

          {/* Step 2: GW2 API Key */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    GW2 API Key (Optional)
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Enter your GW2 API key"
                  className={`input input-bordered w-full ${
                    keyError ? "input-error" : ""
                  }`}
                  value={gw2ApiKey}
                  onChange={(e) => {
                    setGw2ApiKey(e.target.value);
                    setKeyError(null);
                  }}
                  disabled={isValidatingKey}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60">
                    {keyError
                      ? keyError
                      : "If you want, you can provide your GW2 API key for advanced features"}
                  </span>
                </label>
              </div>

              {gw2AccountName && (
                <div className="alert alert-success">
                  <span>Account found: {gw2AccountName}</span>
                </div>
              )}

              {gw2ApiKey.trim() && (
                <button
                  type="button"
                  className="btn btn-primary w-full"
                  onClick={handleValidateGw2Key}
                  disabled={isValidatingKey}
                >
                  {isValidatingKey ? (
                    <>
                      <span className="loading loading-spinner" />
                      Validating...
                    </>
                  ) : (
                    "Validate Key"
                  )}
                </button>
              )}

              <p className="text-sm text-base-content/60">
                You can add your API key later in settings. The key must have
                the "account" scope to extract your account name.
              </p>
            </div>
          )}

          {/* Step 3: Visibility */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Account Name Visibility
                  </span>
                </label>
                <div className="card bg-base-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{gw2AccountName}</p>
                      <p className="text-sm text-base-content/60">
                        Make your GW2 account name visible to other users?
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={gw2AccountNamePublic}
                      onChange={(e) => setGw2AccountNamePublic(e.target.checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons (hidden on step 0; step 0 has its own I Accept button) */}
          {currentStep !== 0 && (
            <div className="card-actions justify-between mt-6">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
              {currentStep === 3 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleComplete}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner" />
                      Starting...
                    </>
                  ) : (
                    "Start with Fashion"
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !usernameValid) ||
                    (currentStep === 2 && isValidatingKey) ||
                    isLoading
                  }
                >
                  {currentStep === 2 && !gw2ApiKey.trim() ? "Skip for now" : "Next"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

