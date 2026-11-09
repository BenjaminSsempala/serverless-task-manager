"use client";

import { useState } from "react";
import { assignTask, updateTask } from "@/lib/api";

const statuses = ["TODO", "IN_PROGRESS", "COMPLETED"];
const label = { TODO: "To do", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

function formatDeadline(deadline) {
  if (!deadline) return null;
  const date = new Date(deadline);
  return Number.isNaN(date.getTime()) ? deadline : date.toLocaleString();
}

function TaskItem({ task, isAdmin, users, assigneeName, onUpdated }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const overdue = task.deadline && task.status !== "COMPLETED" && new Date(task.deadline) < new Date();

  async function save(action) {
    setSaving(true);
    setError("");
    try {
      onUpdated(await action());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const changeStatus = (e) => save(() => updateTask(task.taskId, { status: e.target.value }));
  const changeAssignee = (e) => save(() => assignTask(task.taskId, e.target.value));

  return (
    <li className="task">
      <div className="row">
        <div>
          <h3>{task.title}</h3>
          {task.description && <p className="muted">{task.description}</p>}
        </div>
        <select value={task.status} onChange={changeStatus} disabled={saving} aria-label="Status">
          {statuses.map((s) => (
            <option key={s} value={s}>{label[s]}</option>
          ))}
        </select>
      </div>
      <p className="meta">
        {task.deadline && (
          <span className={overdue ? "overdue" : ""}>
            Due {formatDeadline(task.deadline)}{overdue && " · overdue"}
          </span>
        )}
        {isAdmin && (
          <label className="assign">
            Assigned to
            <select value={task.assigneeId ?? ""} onChange={changeAssignee} disabled={saving}>
              {!users.some((u) => u.userId === task.assigneeId) && (
                <option value={task.assigneeId ?? ""}>{assigneeName ?? "Unassigned"}</option>
              )}
              {users.map((u) => (
                <option key={u.userId} value={u.userId}>{u.name || u.email}</option>
              ))}
            </select>
          </label>
        )}
      </p>
      {error && <p className="error">{error}</p>}
    </li>
  );
}

export default function TaskList({ tasks, isAdmin, users = [], onUpdated }) {
  if (tasks.length === 0) {
    return <p className="muted">{isAdmin ? "No tasks yet." : "No tasks assigned to you yet."}</p>;
  }
  const names = Object.fromEntries(users.map((u) => [u.userId, u.name || u.email]));
  return (
    <ul className="tasks">
      {tasks.map((t) => (
        <TaskItem
          key={t.taskId}
          task={t}
          isAdmin={isAdmin}
          users={users}
          assigneeName={names[t.assigneeId] ?? t.assigneeId}
          onUpdated={onUpdated}
        />
      ))}
    </ul>
  );
}
