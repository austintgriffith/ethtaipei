import { useState } from "react";
import { QRCode } from "../QRCode";

export const QRCodeExample = () => {
  const [url, setUrl] = useState("https://ethtaipei.org");

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-2xl font-bold">QR Code Example</h2>

      <div className="p-4 bg-white rounded-lg shadow-md">
        <QRCode value={url} size={250} />
      </div>

      <div className="w-full max-w-md">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL for QR code"
          className="input input-bordered w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setUrl("https://ethtaipei.org")} className="btn btn-primary">
          ETH Taipei
        </button>
        <button onClick={() => setUrl(window.location.href)} className="btn btn-secondary">
          Current URL
        </button>
      </div>
    </div>
  );
};
