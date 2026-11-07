"use client";

import "@/lib/amplify";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";

function Dashboard({ user, signOut }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchAuthSession().then(({ tokens }) => {
      const claims = tokens?.idToken?.payload ?? {};
      setProfile({
        name: claims.name,
        email: claims.email,
        groups: claims["cognito:groups"] ?? [],
      });
    });
  }, [user]);

  const role = profile?.groups.includes("Admin") ? "Admin" : "Team Member";

  return (
    <section className="card">
      <div className="row">
        <div>
          <h2>Welcome{profile?.name ? `, ${profile.name}` : ""}</h2>
          <p className="muted">{profile?.email}</p>
        </div>
        <span className="badge">{profile ? role : "…"}</span>
      </div>
      <p className="muted">Task lists will appear here soon.</p>
      <button className="button" onClick={signOut}>
        Sign out
      </button>
    </section>
  );
}

export default function AuthGate() {
  return (
    <Authenticator signUpAttributes={["name"]}>
      {({ user, signOut }) => <Dashboard user={user} signOut={signOut} />}
    </Authenticator>
  );
}
