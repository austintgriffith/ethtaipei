"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  // Generate QR code for the current URL
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrCodeUrl = pageUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${pageUrl}` : null;

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

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <h1 className="text-4xl font-bold mb-8">One-Shot Gas Station</h1>

      <div className="max-w-md w-full bg-base-300 rounded-xl p-8 shadow-xl">
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

      {qrCodeUrl && !qrError && (
        <div className="mt-12 flex flex-col items-center">
          <p className="mb-4 text-center">Scan this QR code to access the gas station</p>
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
