import React, { useState, useEffect } from "react";

export const SignTransaction = () => {
  const [amount, setAmount] = useState(0);
  const [address, setAddress] = useState("");
  const [code, setCode] = useState("");
  const [blockhash, setBlockhash] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    solanaWeb3.connection
      ? solanaWeb3.connection.getLatestBlockhash().then((res) => setBlockhash(res.blockhash))
      : new solanaWeb3.Connection("https://sparkling-methodical-uranium.solana-mainnet.quiknode.pro/e480f20642656f69959ce95a15d4094af9d91d2a/")
          .getLatestBlockhash()
          .then((res) => setBlockhash(res.blockhash));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try {
      if (!/^\d{8}$/.test(code)) throw new Error("Code must be 8 digits");
      if (!address) throw new Error("Wallet address required");
      if (!blockhash) throw new Error("Blockhash not ready");
      // Step 1: resolve code to get pubkey
      const resolveRes = await fetch("https://relay.ota.codes/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!resolveRes.ok) throw new Error("Failed to resolve code");
      const resolveData = await resolveRes.json();
      if (!resolveData.pubkey) throw new Error("No pubkey found for code");
      const fromPubkey = new solanaWeb3.PublicKey(resolveData.pubkey);
      const toPubkey = new solanaWeb3.PublicKey(address);
      const lamports = Math.floor(Number(amount) * 1e9);
      const tx = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );
      tx.recentBlockhash = blockhash;
      tx.feePayer = fromPubkey;
      const serialized = tx.serialize({ requireAllSignatures: false });
      const base64tx = buffer.Buffer.from(serialized).toString("base64");
      // Step 2: send transaction
      const response = await fetch("https://relay.ota.codes/api/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          chain: "solana",
          transaction: base64tx,
          intentType: "transaction",
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch (err) {
      setStatus(err.message || "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-xl mx-auto">
        <div className="flex flex-col items-stretch sm:items-center gap-3 w-full">
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (SOL)"
            className="border rounded px-3 py-2 w-full min-w-0"
            disabled={loading}
          />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Recipient Wallet Address"
            className="border rounded px-3 py-2 w-full min-w-0"
            disabled={loading}
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="8-digit code"
            className="border rounded px-3 py-2 w-full sm:w-40 min-w-0"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
            disabled={loading || !address || !/^\d{8}$/.test(code)}
          >
            {loading ? "Submitting..." : "Submit Transaction"}
          </button>
        </div>
        <div className="w-full">
          {status === "success" && <div className="text-green-600">Transaction prepared and sent for signing!</div>}
          {status && status !== "success" && <div className="text-red-600">{status}</div>}
        </div>
      </form>
      <div className="flex flex-col items-center gap-2 mt-4 w-full max-w-xl mx-auto">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50 w-full sm:w-auto"
          disabled={!code || statusLoading}
          onClick={async () => {
            setStatusResult(null);
            setStatusError(null);
            setStatusLoading(true);
            try {
              const res = await fetch(`https://relay.ota.codes/api/status/${code}`);
              if (!res.ok) throw new Error("Failed to fetch status");
              const data = await res.json();
              setStatusResult(data);
            } catch (err) {
              setStatusError("Could not fetch status.");
            } finally {
              setStatusLoading(false);
            }
          }}
        >
          {statusLoading ? "Checking..." : "Check Status"}
        </button>
        {statusResult && (() => {
          if (statusResult.error) {
            return <div className="text-red-600">{statusResult.error}</div>;
          }
          return (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm max-w-xl mt-2 overflow-x-auto">
              <div><span className="font-semibold">Status:</span> {statusResult.status}</div>
              {statusResult.txSignature && (
                <div className="mt-2">
                  <span className="font-semibold">Transaction Signature:</span>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                    <code className="bg-white dark:bg-zinc-900 px-2 py-1 rounded text-xs break-all w-full">{statusResult.txSignature}</code>
                    <button
                      className="text-blue-600 underline text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(statusResult.txSignature);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        {statusError && <div className="text-red-600">{statusError}</div>}
      </div>
    </>
  );
};