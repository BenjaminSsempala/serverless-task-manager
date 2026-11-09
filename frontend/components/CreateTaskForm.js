"use client";

import { useState } from "react";
import { createTask } from "@/lib/api";

const empty = { title: "", description: "", assigneeId: "", deadline: "" };

export default function CreateTaskForm({ users, onCreated }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const task = await createTask({
        title: form.title,
        description: form.description,
        assigneeId: form.assigneeId,
        ...(form.deadline && { deadline: new Date(form.deadline).toISOString() }),
      });
      setForm(empty);
      onCreated(task);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>New task</h2>
      <label>
        Title
        <input required maxLength={200} value={form.title} onChange={set("title")} />
      </label>
      <label>
        Description
        <textarea maxLength={2000} rows={3} value={form.description} onChange={set("description")} />
      </label>
      <label>
        Assignee
        <select required value={form.assigneeId} onChange={set("assigneeId")}>
          <option value="">Choose a team member…</option>
          {users.map((u) => (
            <option key={u.userId} value={u.userId}>
              {u.name || u.email} ({u.email})
            </option>
          ))}
        </select>
      </label>
      <label>
        Deadline (optional)
        <input type="datetime-local" value={form.deadline} onChange={set("deadline")} />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="button primary" disabled={saving}>
        {saving ? "Creating…" : "Create task"}
      </button>
    </form>
  );
}
