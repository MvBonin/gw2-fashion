import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();

    // Validate length
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

    // Validate format
    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return NextResponse.json(
        {
          error:
            "Username can only contain letters, numbers, underscores, and hyphens",
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client with error handling
    let supabaseUrl: string;
    let supabaseKey: string;

    try {
      supabaseUrl = getSupabaseUrl();
      supabaseKey = getSupabaseAnonKey();
    } catch (envError) {
      console.error("Environment variable error:", envError);
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: envError instanceof Error ? envError.message : "Missing Supabase configuration",
        },
        { status: 500 }
      );
    }

    // Check availability using anonymous client (RLS allows public SELECT)
    // Use case-insensitive comparison via PostgreSQL function
    // The unique index on LOWER(username) ensures uniqueness regardless of case
    const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseKey);

    // Use RPC to call the username_exists function for case-insensitive check
    const { data: usernameExists, error: rpcError } = await supabase.rpc(
      "username_exists",
      { check_username: trimmedUsername }
    );

    if (rpcError) {
      console.error("Supabase RPC error:", {
        message: rpcError.message,
        code: rpcError.code,
        details: rpcError.details,
        hint: rpcError.hint,
      });

      // Fallback: try direct query with case-insensitive filter
      // This is a workaround if RPC doesn't work
      const { data: existingUsers, error: queryError } = await supabase
        .from("users")
        .select("id, username")
        .limit(1000);

      if (queryError) {
        return NextResponse.json(
          {
            error: "Error checking username availability",
            details: rpcError.message || queryError.message,
            code: rpcError.code || queryError.code,
          },
          { status: 500 }
        );
      }

      // Filter case-insensitively in memory as fallback
      const lowerInput = trimmedUsername.toLowerCase();
      const existingUser = existingUsers?.find(
        (u) => u.username?.toLowerCase() === lowerInput
      );

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken", available: false },
          { status: 409 }
        );
      }
    } else if (usernameExists === true) {
      return NextResponse.json(
        { error: "Username is already taken", available: false },
        { status: 409 }
      );
    }

    return NextResponse.json({ available: true, username: trimmedUsername });
  } catch (error) {
    console.error("Unexpected error validating username:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Internal server error",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

