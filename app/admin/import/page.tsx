"use client";

import { useState } from "react";

export default function AdminImportPage() {
  const [secret, setSecret] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    setStatus("loading");
    setMessage("");
    try {
      let body: unknown;
      try {
        body = JSON.parse(jsonText) as unknown;
      } catch {
        setStatus("error");
        setMessage("Invalid JSON in the text area.");
        return;
      }
      const res = await fetch("/api/admin/cases/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret.trim()}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string; caseId?: string; title?: string; issues?: unknown };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? `HTTP ${res.status}`);
        if (data.issues) setMessage((m) => `${m}\n${JSON.stringify(data.issues, null, 2)}`);
        return;
      }
      setStatus("done");
      setMessage(`Imported: ${data.title ?? ""}\ncaseId: ${data.caseId ?? ""}`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">Import case (JSON)</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Paste a validated <code className="text-xs">case-import.json</code> body. Requires{" "}
        <code className="text-xs">ADMIN_IMPORT_SECRET</code> on the server and the same value below.
        Do not expose this page in production without network restrictions.
      </p>

      <label className="mt-6 block text-sm font-medium">Bearer secret</label>
      <input
        type="password"
        autoComplete="off"
        className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="Same as ADMIN_IMPORT_SECRET"
      />

      <label className="mt-4 block text-sm font-medium">JSON</label>
      <textarea
        className="border-input bg-background mt-1 min-h-[320px] w-full rounded-md border px-3 py-2 font-mono text-xs"
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        placeholder='{ "title": "...", ... }'
      />

      <button
        type="button"
        disabled={status === "loading" || !secret.trim() || !jsonText.trim()}
        onClick={() => void submit()}
        className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {status === "loading" ? "Importing…" : "Import case"}
      </button>

      {message ? (
        <pre className="bg-muted mt-4 whitespace-pre-wrap rounded-md p-3 text-xs">{message}</pre>
      ) : null}
    </div>
  );
}
