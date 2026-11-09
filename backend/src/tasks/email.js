const { PublishCommand, SNSClient } = require("@aws-sdk/client-sns");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb } = require("./lib");

const sns = new SNSClient({});
const appUrl = "https://main.dou2fg6xeliu9.amplifyapp.com";
const statusLabel = { TODO: "To do", IN_PROGRESS: "In progress", COMPLETED: "Completed" };

async function findUser(userId) {
  if (!userId) return null;
  const result = await dynamodb.send(
    new GetCommand({ TableName: process.env.USERS_TABLE, Key: { userId } }),
  );
  return result.Item ?? null;
}

const displayName = (user) => user?.name || user?.email || "Someone";

function formatDeadline(deadline) {
  if (!deadline) return "No deadline";
  const date = new Date(deadline);
  return Number.isNaN(date.getTime()) ? deadline : date.toUTCString();
}

// recipient is a userId or "admins"; it must match a subscription's filter policy to be delivered.
async function publish(recipient, subject, lines) {
  await sns.send(
    new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Subject: subject.slice(0, 100),
      Message: [...lines, "", `Open Task Manager: ${appUrl}`].join("\n"),
      MessageAttributes: { recipient: { DataType: "String", StringValue: recipient } },
    }),
  );
}

function taskDetails(task) {
  return [
    `Task: ${task.title}`,
    task.description ? `Description: ${task.description}` : null,
    `Status: ${statusLabel[task.status] ?? task.status}`,
    `Deadline: ${formatDeadline(task.deadline)}`,
  ].filter(Boolean);
}

module.exports = { statusLabel, findUser, displayName, formatDeadline, publish, taskDetails };
