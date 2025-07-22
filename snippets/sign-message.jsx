import React, { useState } from "react";

export const SignMessage = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [statusResult, setStatusResult] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    // Reset status check state on new submit
    setStatusResult(null);
    setStatusError(null);
    setStatusLoading(false);
    // Basic validation for 8-digit code
    if (!/^\d{8}$/.test(code)) {
      setStatus("invalid_code");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch("https://relay.ota.codes/api/attach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          chain: "solana",
          message,
          intentType: "sign-only"
        }),
      });
      if (!response.ok) throw new Error("Request failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter message"
            className="border rounded px-3 py-2 min-w-[200px]"
            disabled={loading}
          />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="8-digit code"
            className="border rounded px-3 py-2 min-w-[120px]"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading || !message || !code}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
        <div>
          {status === "success" && <div className="text-green-600">Check your wallet to sign the message.</div>}
          {status === "error" && <div className="text-red-600">Failed to sign message.</div>}
        </div>
      </form>
      <div className="flex flex-col items-center gap-2 mt-4">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={!code || statusLoading}
          onClick={async () => {
            setStatusResult(null);
            setStatusError(null);
            setStatusLoading(true);
            try {
              const res = await fetch(`https://relay.ota.codes/api/status/${code}`);
              if (!res.ok) throw new Error("Failed to fetch status");
              const data = await res.json();
              setStatusResult(JSON.stringify(data, null, 2));
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
          let parsed;
          try {
            parsed = JSON.parse(statusResult);
          } catch {
            return <pre className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded text-xs max-w-xl overflow-x-auto mt-2">{statusResult}</pre>;
          }
          if (parsed.error) {
            return <div className="text-red-600">{parsed.error}</div>;
          }
          return (
            <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm max-w-xl mt-2">
              <div><span className="font-semibold">Status:</span> {parsed.status}</div>
              {parsed.expiresAt && (
                <div><span className="font-semibold">Expires At:</span> {new Date(parsed.expiresAt).toLocaleString()}</div>
              )}
              {parsed.hasMessage && parsed.signedMessage && (
                <div className="mt-2">
                  <span className="font-semibold">Signed Message:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white dark:bg-zinc-900 px-2 py-1 rounded text-xs break-all">{parsed.signedMessage}</code>
                    <button
                      className="text-blue-600 underline text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(parsed.signedMessage);
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
