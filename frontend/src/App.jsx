const features = [
  'Admins create, assign and track tasks',
  'Team members view and update their tasks',
  'Email notifications for assignments and updates',
  'Deadline reminders',
]

function App() {
  return (
    <main className="page">
      <header>
        <span className="badge">In development</span>
        <h1>Task Manager</h1>
        <p className="lead">A serverless task management system on AWS.</p>
      </header>

      <section className="card">
        <h2>Coming soon</h2>
        <ul>
          {features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <footer>
        Built with API Gateway, Lambda, DynamoDB, Cognito and SNS ·{' '}
        <a href="https://github.com/BenjaminSsempala/serverless-task-manager">Source</a>
      </footer>
    </main>
  )
}

export default App
