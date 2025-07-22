import React, { useState } from "react";

export const SignMessage = () => {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
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
  );
};
