# Serverless Task Management System

A task management system built on AWS serverless services. **Admins** create, assign, update and track tasks; **Team Members** view and update the tasks assigned to them.

> 🚧 **Status:** in active development.

**Live app:** https://main.dou2fg6xeliu9.amplifyapp.com

## Architecture

| Service | Role |
|---|---|
| Amazon API Gateway | REST API for task management |
| AWS Lambda | Business logic (create, assign, update, notify, remind) |
| Amazon DynamoDB | Tasks and users |
| Amazon Cognito | Authentication with `Admin` and `TeamMember` groups |
| Amazon SNS | Assignment, update and deadline notifications |
| Amazon S3 | Task file attachments |
| Amazon CloudWatch | Logs and monitoring |
| Amazon EventBridge Scheduler | Hourly deadline-reminder checks |
| AWS Amplify Hosting | Frontend hosting with CI/CD from this repo |

## API

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/tasks` | Admin | Create a task |
| GET | `/tasks` | Admin | List all tasks |
| GET | `/tasks/{taskId}` | Admin, Team Member | Get one task |
| PUT | `/tasks/{taskId}` | Admin, Team Member | Update a task |
| POST | `/tasks/{taskId}/notify` | Admin | Trigger a deadline notification |

## Repository layout

```
backend/    AWS SAM template and Lambda functions
frontend/   Web client (hosted on AWS Amplify)
docs/       Architecture notes and deployment evidence
```

## Roadmap

Full requirements, data model, workflows and security plan: [docs/planning.md](docs/planning.md).

- [x] **Phase 1 — Requirements and planning** ([planning doc](docs/planning.md))
- [ ] **Phase 2 — Environment setup**
  - [x] Cognito user pool with Admin / TeamMember groups
  - [ ] DynamoDB tables
  - [ ] API Gateway with Cognito authorizer
- [ ] **Phase 3 — Lambda development**
- [ ] **Phase 4 — API Gateway configuration**
- [ ] **Phase 5 — Notification system** (SNS, deadline reminders)
- [x] Frontend deployed to Amplify (live link) with login
- [ ] Admin and team-member dashboards
- [ ] Deployment evidence in `docs/`
