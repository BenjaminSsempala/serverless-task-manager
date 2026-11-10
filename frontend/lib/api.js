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
export const notifyTask = (id) => request(`/tasks/${id}/notify`, { method: "POST" });
export const listAttachments = (id) => request(`/tasks/${id}/attachments`).then((d) => d.attachments);

// Gets a presigned upload from the API, then sends the file straight to S3.
export async function uploadAttachment(id, file) {
  const { upload } = await request(`/tasks/${id}/attachments`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type || undefined, size: file.size }),
  });
  const form = new FormData();
  Object.entries(upload.fields).forEach(([name, value]) => form.append(name, value));
  form.append("file", file); // must be the last field
  const res = await fetch(upload.url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
}
