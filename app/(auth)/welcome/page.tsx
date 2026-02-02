"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

export default function WelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [gw2AccountNamePublic, setGw2AccountNamePublic] = useState(false);

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
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile && profile.username_manually_set) {
        // User has completed welcome, redirect to home
        router.push("/");
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

      const data = await response.json();

      if (response.ok && data.success) {
        router.push("/");
      } else {
        setError(data.error || "Failed to complete welcome");
      }
    } catch (err) {
      setError("Error completing welcome");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
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
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
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

          {/* Navigation Buttons */}
          <div className="card-actions justify-between mt-6">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isLoading}
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
                    Completing...
                  </>
                ) : (
                  "Complete Setup"
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
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

