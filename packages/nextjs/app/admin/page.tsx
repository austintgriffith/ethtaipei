"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Address } from "~~/components/scaffold-eth";

export default function AdminPage() {
  const [funderAddress, setFunderAddress] = useState<string | null>(null);
  const [funderBalance, setFunderBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    const fetchFunderAddress = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/getAddress");
        const data = await response.json();

        if (data.success) {
          setFunderAddress(data.address);
          setFunderBalance(data.balance);
        } else {
          setError(data.error || "Failed to get funder address");
        }
      } catch (err) {
        console.error("Error fetching funder address:", err);
        setError("Error connecting to server");
      } finally {
        setLoading(false);
      }
    };

    fetchFunderAddress();

    // Refresh the balance every 10 seconds
    const intervalId = setInterval(fetchFunderAddress, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Generate QR code URL for the address
  const qrCodeUrl = funderAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${funderAddress}`
    : null;

  return (
    <div className="flex flex-col items-center py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="bg-secondary/20 p-8 rounded-xl w-full max-w-lg">
        <h2 className="text-2xl font-semibold mb-4">Funder Wallet</h2>

        {loading ? (
          <div className="flex justify-center my-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error mb-4">
            <p>{error}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center">
            <div className="mb-2 text-center">
              <p className="text-base mb-1">Funder Address:</p>
              {funderAddress && <Address address={funderAddress} format="long" size="lg" />}
            </div>

            <div className="mb-6 text-center">
              <p className="text-base mb-1">Current Balance:</p>
              <p className="text-2xl font-bold">{funderBalance} ETH</p>
            </div>

            {qrCodeUrl && !qrError && (
              <div className="mb-4 bg-white p-4 rounded-lg relative h-80 w-80">
                <Image
                  src={qrCodeUrl}
                  alt="Funder Address QR Code"
                  fill
                  className="object-contain rounded-lg"
                  onError={() => setQrError(true)}
                />
              </div>
            )}

            <div className="text-center text-sm opacity-70 mt-2">
              <p>Scan this code to fund the gas station wallet</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
