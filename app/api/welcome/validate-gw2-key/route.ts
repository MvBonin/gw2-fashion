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

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Basic format validation - check if it looks like a valid key (not empty, reasonable length)
    if (trimmedKey.length < 20 || trimmedKey.length > 100) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 400 }
      );
    }

    // Check token info and scopes - let GW2 API validate the actual format
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
    if (!tokenInfo.permissions || !tokenInfo.permissions.includes("account")) {
      return NextResponse.json(
        {
          error: "API key must have 'account' scope to extract account name",
          scopes: tokenInfo.permissions || [],
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

    return NextResponse.json({
      valid: true,
      accountName: accountInfo.name,
      scopes: tokenInfo.permissions,
    });
  } catch (error) {
    console.error("Error validating GW2 API key:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

