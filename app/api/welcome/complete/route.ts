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

    // Prepare update data
    const updateData: {
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
      updateData.gw2_api_key = gw2ApiKey;
    }
    if (gw2AccountName) {
      updateData.gw2_account_name = gw2AccountName;
    }
    if (typeof gw2AccountNamePublic === "boolean") {
      updateData.gw2_account_name_public = gw2AccountNamePublic;
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating user profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
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

