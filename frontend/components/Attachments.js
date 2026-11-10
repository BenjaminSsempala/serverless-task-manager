"use client";

import { useState } from "react";
import { listAttachments, uploadAttachment } from "@/lib/api";

const maxBytes = 10 * 1024 * 1024;

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Loads on first open, since download links expire after 5 minutes.
export default function Attachments({ taskId }) {
  const [files, setFiles] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      setFiles(await listAttachments(taskId));
    } catch (err) {
      setError(err.message);
    }
  }

  async function upload(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > maxBytes) {
      setError("Files must be 10 MB or smaller");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await uploadAttachment(taskId, file);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="attachments" onToggle={(e) => e.target.open && files === null && load()}>
      <summary>Attachments{files ? ` (${files.length})` : ""}</summary>
      {files?.length === 0 && <p className="muted">No files yet.</p>}
      {files?.length > 0 && (
        <ul>
          {files.map((f) => (
            <li key={f.key}>
              <a href={f.url}>{f.fileName}</a> <span className="muted">{formatSize(f.size)}</span>
            </li>
          ))}
        </ul>
      )}
      <label className="button small upload">
        {busy ? "Uploading…" : "Attach file"}
        <input type="file" onChange={upload} disabled={busy} hidden />
      </label>
      {error && <p className="error">{error}</p>}
    </details>
  );
}
