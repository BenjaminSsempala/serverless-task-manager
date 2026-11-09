import { fetchAuthSession } from "aws-amplify/auth";

const baseUrl = process.env.NEXT_PUBLIC_API_URL;

// Calls the task API with the signed-in user's Cognito ID token.
async function request(path, options = {}) {
  const { tokens } = await fetchAuthSession();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: tokens?.idToken?.toString() ?? "",
      "Content-Type": "application/json",
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? `Request failed (${res.status})`);
  return data;
}

export const listTasks = () => request("/tasks").then((d) => d.tasks);
export const getTask = (id) => request(`/tasks/${id}`).then((d) => d.task);
export const createTask = (task) =>
  request("/tasks", { method: "POST", body: JSON.stringify(task) }).then((d) => d.task);
export const updateTask = (id, changes) =>
  request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(changes) }).then((d) => d.task);
export const listUsers = () => request("/users").then((d) => d.users);
export const assignTask = (id, assigneeId) =>
  request(`/tasks/${id}/assign`, { method: "PUT", body: JSON.stringify({ assigneeId }) }).then((d) => d.task);
