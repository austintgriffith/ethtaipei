import { NextResponse } from "next/server";
import { formatEther } from "viem";
import { createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// Add your private key to .env.local or environment variables
const FUNDER_PRIVATE_KEY = process.env.FUNDER_PRIVATE_KEY;

export async function GET() {
  try {
    if (!FUNDER_PRIVATE_KEY) {
      return NextResponse.json({ success: false, error: "Server wallet not configured" }, { status: 500 });
    }

    const account = privateKeyToAccount(FUNDER_PRIVATE_KEY as `0x${string}`);

    // Create a public client to check balance
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Get the funder balance
    const balance = await publicClient.getBalance({ address: account.address });

    return NextResponse.json({
      success: true,
      address: account.address,
      balance: formatEther(balance),
    });
  } catch (error) {
    console.error("Error getting funder address:", error);
    return NextResponse.json({ success: false, error: "Failed to get funder address" }, { status: 500 });
  }
}
