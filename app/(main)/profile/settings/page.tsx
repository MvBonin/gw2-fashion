"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [gw2AccountNamePublic, setGw2AccountNamePublic] = useState(false);
  const [bio, setBio] = useState("");
  const [bioSaving, setBioSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
          setError("Error loading profile");
          return;
        }

        const profileData = data as UserProfile | null;
        if (profileData) {
          setProfile(profileData);
          setGw2AccountNamePublic(profileData.gw2_account_name_public || false);
          setBio(profileData.bio ?? "");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Unexpected error");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router, supabase]);

  const handleValidateAndSaveKey = async () => {
    if (!newApiKey.trim()) {
      setKeyError("Please enter an API key");
      return;
    }

    setIsValidatingKey(true);
    setKeyError(null);
    setError(null);

    try {
      // Validate the key first
      const validateResponse = await fetch("/api/welcome/validate-gw2-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: newApiKey.trim() }),
      });

      const validateData = await validateResponse.json();

      if (!validateResponse.ok || !validateData.valid) {
        setKeyError(validateData.error || "Invalid API key");
        return;
      }

      // Save the key
      const saveResponse = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gw2ApiKey: newApiKey.trim(),
          gw2AccountName: validateData.accountName,
        }),
      });

      const saveData = await saveResponse.json();

      if (!saveResponse.ok) {
        setError(saveData.error || "Error saving API key");
        return;
      }

      // Reload profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
        }
      }

      setNewApiKey("");
      setSuccess("API key saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error validating/saving key:", err);
      setKeyError("Error validating or saving API key");
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm("Are you sure you want to delete the API key?")) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gw2ApiKey: null }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error deleting API key");
        return;
      }

      // Reload profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
        }
      }

      setSuccess("API key deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting key:", err);
      setError("Error deleting API key");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    setBioSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bio.trim() || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error saving description");
        return;
      }

      if (profile) {
        setProfile({ ...profile, bio: bio.trim() || null });
      }
      setSuccess("Description saved");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving bio:", err);
      setError("Error saving description");
    } finally {
      setBioSaving(false);
    }
  };

  const handleToggleVisibility = async () => {
    const newValue = !gw2AccountNamePublic;
    setGw2AccountNamePublic(newValue);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/profile/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gw2AccountNamePublic: newValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGw2AccountNamePublic(!newValue); // Revert on error
        setError(data.error || "Error updating visibility");
        return;
      }

      // Reload profile
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
        }
      }

      setSuccess("Settings updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating visibility:", err);
      setGw2AccountNamePublic(!newValue); // Revert on error
      setError("Error updating visibility");
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center items-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Settings</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
        </div>
      )}

      {/* GW2 API Key Section */}
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">GW2 API Key</h2>

          {profile?.gw2_api_key ? (
            <div className="space-y-4">
              <div className="alert alert-info">
                <span>An API key is saved.</span>
              </div>
              {profile.gw2_account_name && (
                <p className="text-base-content/70">
                  Account: <strong>{profile.gw2_account_name}</strong>
                </p>
              )}
              <button
                className="btn btn-error"
                onClick={handleDeleteKey}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete API Key"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New GW2 API Key</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter API key"
                  className="input input-bordered w-full"
                  value={newApiKey}
                  onChange={(e) => {
                    setNewApiKey(e.target.value);
                    setKeyError(null);
                  }}
                  disabled={isValidatingKey}
                />
                {keyError && (
                  <label className="label">
                    <span className="label-text-alt text-error">
                      {keyError}
                    </span>
                  </label>
                )}
              </div>
              <button
                className="btn btn-primary"
                onClick={handleValidateAndSaveKey}
                disabled={isValidatingKey || !newApiKey.trim()}
              >
                {isValidatingKey ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Validating...
                  </>
                ) : (
                  "Save API Key"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bio / Description Section */}
      <div className="card bg-base-200 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Description</h2>
          <p className="text-base-content/70 mb-4">
            This description is shown on your profile.
          </p>
          <div className="form-control">
            <textarea
              className="textarea textarea-bordered w-full min-h-[120px]"
              placeholder="Introduce yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={1000}
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {bio.length}/1000 characters
              </span>
            </label>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSaveBio}
            disabled={bioSaving || bio.trim() === (profile?.bio ?? "").trim()}
          >
            {bioSaving ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Saving...
              </>
            ) : (
              "Save description"
            )}
          </button>
        </div>
      </div>

      {/* GW2 Account Visibility Section */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">
            GW2 Account Visibility
          </h2>
          <p className="text-base-content/70 mb-4">
            Choose whether your GW2 account name is displayed on your profile.
          </p>
          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={gw2AccountNamePublic}
                onChange={handleToggleVisibility}
                disabled={!profile?.gw2_account_name}
              />
              <span className="label-text">
                Show GW2 account name publicly
              </span>
            </label>
            {!profile?.gw2_account_name && (
              <label className="label">
                <span className="label-text-alt text-warning">
                  You must add an API key first to enable this option.
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

