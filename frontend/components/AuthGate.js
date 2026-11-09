"use client";

import "@/lib/amplify";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import CreateTaskForm from "@/components/CreateTaskForm";
import TaskList from "@/components/TaskList";
import { listTasks, listUsers } from "@/lib/api";

function Dashboard({ user, signOut }) {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAuthSession().then(({ tokens }) => {
      const claims = tokens?.idToken?.payload ?? {};
      setProfile({
        userId: claims.sub,
        name: claims.name,
        email: claims.email,
        groups: claims["cognito:groups"] ?? [],
      });
    });
    listTasks()
      .then(setTasks)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const isAdmin = profile?.groups.includes("Admin");

  useEffect(() => {
    if (isAdmin) listUsers().then(setUsers).catch((err) => setError(err.message));
  }, [isAdmin]);

  const replaceTask = (updated) =>
    setTasks((current) => current.map((t) => (t.taskId === updated.taskId ? updated : t)));

  return (
    <>
      <section className="card">
        <div className="row">
          <div>
            <h2>Welcome{profile?.name ? `, ${profile.name}` : ""}</h2>
            <p className="muted">{profile?.email}</p>
          </div>
          <span className="badge">{profile ? (isAdmin ? "Admin" : "Team Member") : "…"}</span>
        </div>
        <button className="button" onClick={signOut}>
          Sign out
        </button>
      </section>

      {isAdmin && <CreateTaskForm users={users} onCreated={(task) => setTasks((current) => [task, ...current])} />}

      <section className="card">
        <h2>{isAdmin ? "All tasks" : "My tasks"}</h2>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <TaskList tasks={tasks} isAdmin={isAdmin} users={users} onUpdated={replaceTask} />
        )}
      </section>
    </>
  );
}

export default function AuthGate() {
  return (
    <Authenticator signUpAttributes={["name"]}>
      {({ user, signOut }) => <Dashboard user={user} signOut={signOut} />}
    </Authenticator>
  );
}
