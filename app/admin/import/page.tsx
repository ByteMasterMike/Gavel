"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminImportPage() {
  const [secret, setSecret] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSecretChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSecret(e.target.value);
  }, []);

  const handleJsonChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
  }, []);

  const handleSubmitImport = useCallback(async () => {
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
        let msg = data.error ?? `HTTP ${res.status}`;
        if (data.issues) msg = `${msg}\n${JSON.stringify(data.issues, null, 2)}`;
        setMessage(msg);
        return;
      }
      setStatus("done");
      setMessage(`Imported: ${data.title ?? ""}\ncaseId: ${data.caseId ?? ""}`);
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Request failed");
    }
  }, [jsonText, secret]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10" aria-labelledby="admin-import-title">
      <h1 id="admin-import-title" className="font-serif text-2xl font-semibold tracking-tight">
        Import case (JSON)
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Paste a validated <code className="text-xs">case-import.json</code> body. Requires{" "}
        <code className="text-xs">ADMIN_IMPORT_SECRET</code> on the server and the same value below. Do not expose this
        page in production without network restrictions.
      </p>

      <div className="mt-6 space-y-2">
        <Label htmlFor="admin-import-secret">Bearer secret</Label>
        <Input
          id="admin-import-secret"
          type="password"
          autoComplete="off"
          value={secret}
          onChange={handleSecretChange}
          placeholder="Same as ADMIN_IMPORT_SECRET"
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="admin-import-json">JSON</Label>
        <Textarea
          id="admin-import-json"
          className="min-h-[320px] font-mono text-xs"
          value={jsonText}
          onChange={handleJsonChange}
          placeholder='{ "title": "...", ... }'
          spellCheck={false}
        />
      </div>

      <Button
        type="button"
        className="mt-4"
        disabled={status === "loading" || !secret.trim() || !jsonText.trim()}
        onClick={() => void handleSubmitImport()}
      >
        {status === "loading" ? "Importing…" : "Import case"}
      </Button>

      {message ? (
        <pre className="bg-muted mt-4 whitespace-pre-wrap rounded-md p-3 text-xs" role="status">
          {message}
        </pre>
      ) : null}
    </main>
  );
}
