# AWS Serverless Task Management System

A learning project that demonstrates a small task management workflow using AWS serverless services. Admins create and assign tasks; team members view their assigned tasks and update status.

> **Status:** Phase 1 planning is being kept intentionally small. Implementation has not started for the task management workflow.

**Live frontend:** https://main.dou2fg6xeliu9.amplifyapp.com

## Planned learning flow

1. Admin signs in and creates a task assigned to a team member.
2. The team member receives an assignment email.
3. The team member signs in and updates the task status.
4. Admin views the updated task.

## AWS services

- **Cognito:** sign-in and role distinction
- **API Gateway:** task API endpoints
- **Lambda:** task operations and notification logic
- **DynamoDB:** user and task records
- **SNS:** assignment email
- **CloudWatch:** basic logs for learning and debugging
- **Amplify Hosting:** frontend hosting from this repository

S3 attachments, automated deadline reminders, and Step Functions are extensions, not part of the initial implementation.

## Repository layout

```
backend/    Task API and AWS configuration (to be implemented)
frontend/   Web client hosted on Amplify
 docs/      Project planning and deployment notes
```

## Roadmap

- [x] Repository and frontend placeholder
- [x] Phase 1: Requirement Analysis and Planning ([docs/planning.md](docs/planning.md))
- [ ] Phase 2: Setting Up the Environment (Cognito, DynamoDB, API Gateway)
- [ ] Phase 3: Lambda Functions Development
- [ ] Phase 4: API Gateway Configuration
- [ ] Phase 5: Notification System (SNS)
- [ ] Optional extensions: S3 attachments, automatic deadline reminders, Step Functions
