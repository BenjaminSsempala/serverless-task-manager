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
| Amazon EventBridge Scheduler | Periodic deadline-reminder checks |
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

- [x] Repository set up
- [x] Frontend skeleton deployed to Amplify (live link)
- [ ] Cognito user pool with Admin / TeamMember groups
- [ ] DynamoDB tables and API Gateway
- [ ] Task Lambda functions
- [ ] SNS notifications and deadline reminders
- [ ] S3 attachments
- [ ] Deployment evidence in `docs/`
