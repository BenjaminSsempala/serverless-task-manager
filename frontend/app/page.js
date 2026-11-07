import AuthGate from "@/components/AuthGate";

export default function Home() {
  return (
    <main className="page">
      <header>
        <span className="badge">In development</span>
        <h1>Task Manager</h1>
        <p className="lead">A serverless task management system on AWS.</p>
      </header>

      <AuthGate />

      <footer>
        Built with API Gateway, Lambda, DynamoDB, Cognito and SNS ·{" "}
        <a href="https://github.com/BenjaminSsempala/serverless-task-manager">Source</a>
      </footer>
    </main>
  );
}
