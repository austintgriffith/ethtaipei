"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [votingStatus, setVotingStatus] = useState<string | null>(null);

  // Generate QR code for the current URL
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrCodeUrl = pageUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pageUrl}` : null;

  // Read contract data
  const { data: voteCounts } = useScaffoldReadContract({
    contractName: "VoteContract",
    functionName: "getVoteCounts",
  });

  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "VoteContract",
    functionName: "hasAddressVoted",
    args: [connectedAddress as `0x${string}` | undefined],
    query: {
      enabled: !!connectedAddress,
    },
  });

  // Set up contract write functions
  const { writeContractAsync: voteYes, isMining: isVotingYes } = useScaffoldWriteContract({
    contractName: "VoteContract",
  });

  const { writeContractAsync: voteNo, isMining: isVotingNo } = useScaffoldWriteContract({
    contractName: "VoteContract",
  });

  // Handle voting functions
  const handleVoteYes = async () => {
    try {
      const result = await voteYes({
        functionName: "vote",
        args: [true],
      });
      if (result) {
        setVotingStatus("Successfully voted Yes!");
      }
    } catch (err) {
      console.error("Error voting yes:", err);
      setVotingStatus(`Error voting: ${(err as Error).message}`);
    }
  };

  const handleVoteNo = async () => {
    try {
      const result = await voteNo({
        functionName: "vote",
        args: [false],
      });
      if (result) {
        setVotingStatus("Successfully voted No!");
      }
    } catch (err) {
      console.error("Error voting no:", err);
      setVotingStatus(`Error voting: ${(err as Error).message}`);
    }
  };

  // Request gas when the connected address changes
  useEffect(() => {
    if (!connectedAddress) {
      setStatus(null);
      setTxHash(null);
      return;
    }

    const requestGas = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatus("Requesting gas...");

        const response = await fetch("/api/sendGas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ address: connectedAddress }),
        });

        const data = await response.json();

        if (data.success) {
          setStatus(`Successfully received ${data.amount} ETH!`);
          setTxHash(data.hash);
        } else {
          if (data.error === "Address already has sufficient gas") {
            setStatus(`Your account already has gas (${data.balance} ETH)`);
          } else {
            setError(data.error || "Failed to get gas");
          }
        }
      } catch (err) {
        console.error("Error requesting gas:", err);
        setError("Error connecting to server");
      } finally {
        setIsLoading(false);
      }
    };

    requestGas();
  }, [connectedAddress]);

  // Parse vote counts
  const yesVotes = voteCounts?.[0]?.toString() || "0";
  const noVotes = voteCounts?.[1]?.toString() || "0";
  const totalVotes = voteCounts?.[2]?.toString() || "0";

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <h1 className="text-4xl font-bold mb-8">Vibe Check</h1>

      <div className="max-w-md w-full bg-base-300 rounded-xl p-8 shadow-xl mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome</h2>
          <p className="mb-4">
            This gas station will send you a small amount of ETH for gas when you connect your wallet.
          </p>
        </div>

        <div className="my-6">
          <p className="text-center font-medium mb-2">Your Address:</p>
          <div className="flex justify-center">
            <Address address={connectedAddress} />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center my-6">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}

        {status && (
          <div className="alert alert-success mb-4">
            <p>{status}</p>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <p>{error}</p>
          </div>
        )}

        {txHash && (
          <div className="text-center my-4 text-sm">
            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="link">
              View transaction on BaseScan
            </a>
          </div>
        )}
      </div>

      {/* Voting Section */}
      <div className="max-w-md w-full bg-base-300 rounded-xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Is the vibe good?</h2>

          <div className="stats shadow mb-8 w-full">
            <div className="stat">
              <div className="stat-title">Yes Votes</div>
              <div className="stat-value text-success">{yesVotes}</div>
            </div>

            <div className="stat">
              <div className="stat-title">No Votes</div>
              <div className="stat-value text-error">{noVotes}</div>
            </div>

            <div className="stat">
              <div className="stat-title">Total</div>
              <div className="stat-value">{totalVotes}</div>
            </div>
          </div>

          {!hasVoted && connectedAddress ? (
            <div className="flex gap-4 justify-center">
              <button className="btn btn-success btn-lg" onClick={handleVoteYes} disabled={isVotingYes || isVotingNo}>
                {isVotingYes ? <span className="loading loading-spinner"></span> : "Yes"}
              </button>

              <button className="btn btn-error btn-lg" onClick={handleVoteNo} disabled={isVotingYes || isVotingNo}>
                {isVotingNo ? <span className="loading loading-spinner"></span> : "No"}
              </button>
            </div>
          ) : (
            <div className="alert alert-info">
              <p>{hasVoted ? "You have already voted!" : "Connect your wallet to vote"}</p>
            </div>
          )}

          {votingStatus && (
            <div className="mt-4 alert alert-info">
              <p>{votingStatus}</p>
            </div>
          )}
        </div>
      </div>

      {qrCodeUrl && !qrError && (
        <div className="mt-12 flex flex-col items-center">
          <p className="mb-4 text-center">Scan this QR code to access the page</p>
          <div className="bg-white p-4 rounded-lg relative h-64 w-64">
            <Image
              src={qrCodeUrl}
              alt="Page URL QR Code"
              fill
              className="object-contain rounded-lg"
              onError={() => setQrError(true)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
