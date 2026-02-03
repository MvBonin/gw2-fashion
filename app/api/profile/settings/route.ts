import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const GW2_API_BASE_URL = "https://api.guildwars2.com";

interface TokenInfo {
  id: string;
  name: string;
  permissions: string[];
}

interface AccountInfo {
  id: string;
  name: string;
  age: number;
  world: number;
  guilds: string[];
  guild_leader: string[];
  created: string;
  access: string[];
  commander: boolean;
  fractal_level: number;
  daily_ap: number;
  monthly_ap: number;
  wvw_rank: number;
}

export async function PATCH(request: Request) {
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
    const { gw2ApiKey, gw2AccountName, gw2AccountNamePublic, bio } = body;

    // Prepare update data
    const updateData: {
      gw2_api_key?: string | null;
      gw2_account_name?: string | null;
      gw2_account_name_public?: boolean;
      bio?: string | null;
    } = {};

    // Handle API key update
    if (body.hasOwnProperty("gw2ApiKey")) {
      if (gw2ApiKey === null || gw2ApiKey === "") {
        // Delete API key
        updateData.gw2_api_key = null;
        updateData.gw2_account_name = null;
        // Also set visibility to false when deleting key
        updateData.gw2_account_name_public = false;
      } else if (typeof gw2ApiKey === "string") {
        // Validate and set new API key
        const trimmedKey = gw2ApiKey.trim();

        // Basic format validation
        if (trimmedKey.length < 20 || trimmedKey.length > 100) {
          return NextResponse.json(
            { error: "Invalid API key format" },
            { status: 400 }
          );
        }

        // Validate with GW2 API
        const tokenInfoResponse = await fetch(
          `${GW2_API_BASE_URL}/v2/tokeninfo?access_token=${trimmedKey}`
        );

        if (!tokenInfoResponse.ok) {
          if (tokenInfoResponse.status === 401) {
            return NextResponse.json(
              { error: "Invalid API key" },
              { status: 401 }
            );
          }
          return NextResponse.json(
            { error: "Failed to validate API key" },
            { status: tokenInfoResponse.status }
          );
        }

        const tokenInfo: TokenInfo = await tokenInfoResponse.json();

        // Check if account scope is present
        if (
          !tokenInfo.permissions ||
          !tokenInfo.permissions.includes("account")
        ) {
          return NextResponse.json(
            {
              error:
                "API key must have 'account' scope to extract account name",
            },
            { status: 403 }
          );
        }

        // Get account name
        const accountResponse = await fetch(
          `${GW2_API_BASE_URL}/v2/account?access_token=${trimmedKey}`
        );

        if (!accountResponse.ok) {
          return NextResponse.json(
            { error: "Failed to fetch account information" },
            { status: accountResponse.status }
          );
        }

        const accountInfo: AccountInfo = await accountResponse.json();

        // Use provided account name or fetch from API
        updateData.gw2_api_key = trimmedKey;
        updateData.gw2_account_name =
          gw2AccountName || accountInfo.name || null;
      }
    }

    // Handle visibility update
    if (typeof gw2AccountNamePublic === "boolean") {
      updateData.gw2_account_name_public = gw2AccountNamePublic;
    }

    // Handle bio/description update
    if (body.hasOwnProperty("bio")) {
      if (bio === null || bio === "") {
        updateData.bio = null;
      } else if (typeof bio === "string") {
        const trimmed = bio.trim();
        if (trimmed.length > 1000) {
          return NextResponse.json(
            { error: "Description must be at most 1000 characters." },
            { status: 400 }
          );
        }
        updateData.bio = trimmed || null;
      }
    }

    // If no updates, return error
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    // Update user profile (Supabase client .update() can infer arg as never)
    const { error: updateError } = await supabase
      .from("users")
      // @ts-ignore - DB typings
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in settings update:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

