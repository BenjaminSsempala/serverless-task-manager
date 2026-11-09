const { PublishCommand, SNSClient } = require("@aws-sdk/client-sns");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
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

// recipient is a userId or "admins"
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

// Works out which emails a single task change needs
async function handleChange(oldTask, newTask) {
  const assigneeChanged = newTask.assigneeId && newTask.assigneeId !== oldTask?.assigneeId;

  if (assigneeChanged) {
    await publish(newTask.assigneeId, `New task assigned: ${newTask.title}`, [
      "You have been assigned a task.",
      "",
      ...taskDetails(newTask),
    ]);
  }

  if (!oldTask) return;

  if (newTask.status !== oldTask.status) {
    const actor = await findUser(newTask.updatedBy ?? newTask.assigneeId);
    await publish("admins", `Task ${statusLabel[newTask.status] ?? newTask.status}: ${newTask.title}`, [
      `${displayName(actor)} moved "${newTask.title}" from ${statusLabel[oldTask.status] ?? oldTask.status} to ${statusLabel[newTask.status] ?? newTask.status}.`,
      "",
      ...taskDetails(newTask),
    ]);
  }
  // If the deadline changed, notify the assignee
  if (newTask.deadline !== oldTask.deadline && newTask.assigneeId && !assigneeChanged) {
    await publish(newTask.assigneeId, `Deadline changed: ${newTask.title}`, [
      `The deadline for "${newTask.title}" is now ${formatDeadline(newTask.deadline)}.`,
      "",
      ...taskDetails(newTask),
    ]);
  }
}

// Task Status Notification Lambda, triggered by the Tasks table's DynamoDB stream
exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === "REMOVE") continue;
    const { OldImage, NewImage } = record.dynamodb;
    const oldTask = OldImage ? unmarshall(OldImage) : null;
    const newTask = unmarshall(NewImage);
    try {
      await handleChange(oldTask, newTask);
    } catch (error) {
      console.error("Notification failed for task", newTask.taskId, error);
      throw error;
    }
  }
};
