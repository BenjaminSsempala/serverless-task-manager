const { randomUUID } = require("node:crypto");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb, tableName, response, parseBody, withIdentity } = require("./lib");

// Task Creation Lambda: POST /tasks (Admin only)
exports.handler = withIdentity("Create task", async (event, userId, groups) => {
  if (!groups.includes("Admin")) {
    return response(403, { message: "Only Admins can create tasks" });
  }

  const parsed = parseBody(event);
  if (parsed.error) return response(400, { message: parsed.error });

  const { title, description = "", assigneeId, deadline } = parsed.body;
  if (typeof title !== "string" || !title.trim() || title.length > 200) {
    return response(400, { message: "title is required and must be at most 200 characters" });
  }
  if (typeof assigneeId !== "string" || !assigneeId.trim()) {
    return response(400, { message: "assigneeId is required" });
  }
  if (typeof description !== "string" || description.length > 2000) {
    return response(400, { message: "description must be at most 2000 characters" });
  }
  if (deadline !== undefined && typeof deadline !== "string") {
    return response(400, { message: "deadline must be a date string" });
  }

  const task = {
    taskId: randomUUID(),
    title: title.trim(),
    description,
    assigneeId: assigneeId.trim(),
    status: "TODO",
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
  if (deadline) task.deadline = deadline;

  await dynamodb.send(new PutCommand({ TableName: tableName, Item: task }));
  return response(201, { task });
});
