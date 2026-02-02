import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, gw2ApiKey, gw2AccountName, gw2AccountNamePublic } = body;

    // Username is required
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format (same as validation endpoint)
    const USERNAME_MIN_LENGTH = 3;
    const USERNAME_MAX_LENGTH = 50;
    const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;
    const trimmedUsername = username.trim();

    if (
      trimmedUsername.length < USERNAME_MIN_LENGTH ||
      trimmedUsername.length > USERNAME_MAX_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain letters, numbers, underscores, and hyphens",
        },
        { status: 400 }
      );
    }

    // Check if username is available (excluding current user)
    // Use case-insensitive comparison via RPC function
    const { data: usernameExists, error: rpcError } = await supabase.rpc(
      "username_exists",
      { check_username: trimmedUsername }
    );

    if (rpcError) {
      console.error("Error checking username:", rpcError);
      // Fallback to direct query
      const { data: existingUsers, error: checkError } = await supabase
        .from("users")
        .select("id, username")
        .limit(1000);

      if (checkError) {
        return NextResponse.json(
          { error: "Error checking username availability" },
          { status: 500 }
        );
      }

      // Filter case-insensitively, excluding current user
      const lowerInput = trimmedUsername.toLowerCase();
      const existingUser = existingUsers?.find(
        (u) =>
          u.id !== user.id && u.username?.toLowerCase() === lowerInput
      );

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    } else if (usernameExists === true) {
      // Check if it's the current user's username (allowed)
      const { data: currentUser } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      if (
        !currentUser ||
        currentUser.username.toLowerCase() !== trimmedUsername.toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    // Prepare data
    const profileData: {
      username: string;
      username_manually_set: boolean;
      gw2_api_key?: string | null;
      gw2_account_name?: string | null;
      gw2_account_name_public?: boolean;
    } = {
      username: trimmedUsername,
      username_manually_set: true,
    };

    // Add GW2 data if provided
    if (gw2ApiKey) {
      profileData.gw2_api_key = gw2ApiKey;
    }
    if (gw2AccountName) {
      profileData.gw2_account_name = gw2AccountName;
    }
    if (typeof gw2AccountNamePublic === "boolean") {
      profileData.gw2_account_name_public = gw2AccountNamePublic;
    }

    // Update or insert user profile
    let dbError;
    if (existingProfile) {
      // User exists, update
      const { data: updateData, error: updateError } = await supabase
        .from("users")
        .update(profileData)
        .eq("id", user.id)
        .select();
      dbError = updateError;
      
      if (dbError) {
        // Check if it's a unique constraint violation (username already taken)
        if (dbError.code === "23505" || dbError.message?.includes("unique") || dbError.message?.includes("duplicate")) {
          return NextResponse.json(
            { error: "Username is already taken" },
            { status: 409 }
          );
        }
      }
    } else {
      // User doesn't exist, insert (shouldn't happen normally, but handle it)
      // Note: This might fail due to RLS if there's no INSERT policy
      const { data: insertData, error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          ...profileData,
        })
        .select();
      dbError = insertError;
      
      if (dbError) {
        // If insert fails, try update instead (user might have been created by trigger)
        const { error: retryUpdateError } = await supabase
          .from("users")
          .update(profileData)
          .eq("id", user.id);
        dbError = retryUpdateError;
      }
    }

    if (dbError) {
      console.error("Error saving user profile:", {
        error: dbError,
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint,
        existingProfile: !!existingProfile,
        userId: user.id,
        profileData,
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to save profile";
      if (dbError.code === "23505") {
        errorMessage = "Username is already taken";
      } else if (dbError.message?.includes("permission") || dbError.message?.includes("policy")) {
        errorMessage = "Permission denied. Please contact support.";
      } else if (dbError.message) {
        errorMessage = dbError.message;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: dbError.details || dbError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing welcome:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

