import { NextRequest, NextResponse } from "next/server";
import { formatEther, parseEther } from "viem";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";

// Add your private key to .env.local or environment variables
const FUNDER_PRIVATE_KEY = process.env.FUNDER_PRIVATE_KEY;
const GAS_AMOUNT = parseEther("0.00001");

export async function POST(req: NextRequest) {
  try {
    if (!FUNDER_PRIVATE_KEY) {
      return NextResponse.json({ success: false, error: "Server wallet not configured" }, { status: 500 });
    }

    const { address } = await req.json();

    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      return NextResponse.json({ success: false, error: "Invalid address provided" }, { status: 400 });
    }

    const account = privateKeyToAccount(FUNDER_PRIVATE_KEY as `0x${string}`);

    // Create a public client to check balances
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });

    // Check recipient's balance first
    const recipientBalance = await publicClient.getBalance({ address: address as `0x${string}` });
    if (recipientBalance >= GAS_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          error: "Address already has sufficient gas",
          balance: formatEther(recipientBalance),
        },
        { status: 400 },
      );
    }

    // Check funder's balance
    const funderBalance = await publicClient.getBalance({ address: account.address });
    if (funderBalance <= GAS_AMOUNT) {
      return NextResponse.json(
        {
          success: false,
          error: "Funder has insufficient balance",
          balance: formatEther(funderBalance),
        },
        { status: 500 },
      );
    }

    // Create a wallet client to send transaction
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    // Send gas to the user
    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: GAS_AMOUNT,
    });

    return NextResponse.json({
      success: true,
      hash,
      amount: formatEther(GAS_AMOUNT),
      message: "Gas sent successfully",
    });
  } catch (error) {
    console.error("Error sending gas:", error);
    return NextResponse.json({ success: false, error: "Failed to send gas" }, { status: 500 });
  }
}
