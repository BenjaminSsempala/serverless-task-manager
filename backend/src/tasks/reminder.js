const { GetCommand, QueryCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb, tableName, response, withIdentity } = require("./lib");
const { findUser, displayName, formatDeadline, publish, taskDetails } = require("./email");

const windowHours = Number(process.env.REMINDER_WINDOW_HOURS ?? 24);
const openStatuses = ["TODO", "IN_PROGRESS"];

const isOverdue = (task, now) => new Date(task.deadline) < now;

function sendReminder(task) {
  return publish(task.assigneeId, `Reminder: "${task.title}" is due ${formatDeadline(task.deadline)}`, [
    `"${task.title}" is due soon.`,
    "",
    ...taskDetails(task),
  ]);
}

async function sendOverdueNotice(task) {
  const lines = [`"${task.title}" passed its deadline and isn't completed.`, "", ...taskDetails(task)];
  await publish(task.assigneeId, `Overdue: ${task.title}`, lines);

  const assignee = await findUser(task.assigneeId);
  await publish("admins", `Overdue: ${task.title} (${displayName(assignee)})`, [
    `${displayName(assignee)}'s task is overdue.`,
    "",
    ...lines.slice(2),
  ]);
}

// Records that a notice was sent, so the hourly run doesn't send it again.
function markSent(taskId, field, now) {
  return dynamodb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { taskId },
      UpdateExpression: "SET #field = :now",
      ExpressionAttributeNames: { "#field": field },
      ExpressionAttributeValues: { ":now": now.toISOString() },
    }),
  );
}

// Open tasks with a deadline before the cutoff, including overdue ones.
async function findDueTasks(cutoff) {
  const tasks = [];
  for (const status of openStatuses) {
    let ExclusiveStartKey;
    do {
      const page = await dynamodb.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "StatusDeadlineIndex",
          KeyConditionExpression: "#status = :status AND deadline <= :cutoff",
          ExpressionAttributeNames: { "#status": "status" },
          ExpressionAttributeValues: { ":status": status, ":cutoff": cutoff.toISOString() },
          ExclusiveStartKey,
        }),
      );
      tasks.push(...(page.Items ?? []));
      ExclusiveStartKey = page.LastEvaluatedKey;
    } while (ExclusiveStartKey);
  }
  return tasks;
}

// Scheduled run: one reminder per task in the window, one overdue notice once it passes.
async function runSchedule() {
  const now = new Date();
  const cutoff = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const counts = { reminders: 0, overdue: 0 };

  for (const task of await findDueTasks(cutoff)) {
    if (!task.assigneeId) continue;
    if (isOverdue(task, now)) {
      if (task.overdueNotifiedAt) continue;
      await sendOverdueNotice(task);
      await markSent(task.taskId, "overdueNotifiedAt", now);
      counts.overdue += 1;
    } else if (!task.reminderSentAt) {
      await sendReminder(task);
      await markSent(task.taskId, "reminderSentAt", now);
      counts.reminders += 1;
    }
  }

  console.log("Deadline reminders sent", counts);
  return counts;
}

// POST /tasks/{taskId}/notify (Admin only): send a reminder for one task now.
const notifyOne = withIdentity("Notify task", async (event, userId, groups) => {
  if (!groups.includes("Admin")) {
    return response(403, { message: "Only Admins can send reminders" });
  }

  const result = await dynamodb.send(
    new GetCommand({ TableName: tableName, Key: { taskId: event.pathParameters.taskId } }),
  );
  const task = result.Item;
  if (!task) return response(404, { message: "Task not found" });
  if (!task.assigneeId) return response(400, { message: "Task has no assignee" });
  if (!task.deadline) return response(400, { message: "Task has no deadline" });
  if (task.status === "COMPLETED") return response(400, { message: "Task is already completed" });

  if (isOverdue(task, new Date())) {
    await sendOverdueNotice(task);
  } else {
    await sendReminder(task);
  }
  return response(200, { message: "Reminder sent" });
});

// API Gateway events have httpMethod; EventBridge Scheduler events don't.
exports.handler = (event) => (event.httpMethod ? notifyOne(event) : runSchedule());
