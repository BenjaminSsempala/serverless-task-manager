const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const {
  dynamodb,
  tableName,
  validStatuses,
  response,
  hasTaskRole,
  parseBody,
  canAccessTask,
  findTask,
  withIdentity,
} = require("./lib");

const adminFields = new Set(["title", "description", "assigneeId", "deadline", "status"]);
const memberFields = new Set(["status"]);

// Task Update Lambda: PUT /tasks/{taskId}
// Admins can change any field; Team Members can only change status on their own tasks.
exports.handler = withIdentity("Update task", async (event, userId, groups) => {
  if (!hasTaskRole(groups)) {
    return response(403, { message: "User has no task role" });
  }

  const taskId = event.pathParameters.taskId;
  const task = await findTask(taskId);
  if (!task) return response(404, { message: "Task not found" });
  if (!canAccessTask(task, userId, groups)) {
    return response(403, { message: "You cannot update this task" });
  }

  const parsed = parseBody(event);
  if (parsed.error) return response(400, { message: parsed.error });
  const changes = parsed.body;
  const fields = Object.keys(changes);
  if (fields.length === 0) {
    return response(400, { message: "Provide at least one field to update" });
  }

  const allowedFields = groups.includes("Admin") ? adminFields : memberFields;
  if (fields.some((field) => !allowedFields.has(field))) {
    return response(403, {
      message: groups.includes("Admin")
        ? "One or more fields cannot be changed"
        : "Team Members can only update task status",
    });
  }
  if ("status" in changes && !validStatuses.has(changes.status)) {
    return response(400, { message: "status must be TODO, IN_PROGRESS, or COMPLETED" });
  }
  if ("title" in changes && (typeof changes.title !== "string" || !changes.title.trim())) {
    return response(400, { message: "title must be a non-empty string" });
  }
  if ("description" in changes && typeof changes.description !== "string") {
    return response(400, { message: "description must be a string" });
  }
  if (
    "assigneeId" in changes &&
    (typeof changes.assigneeId !== "string" || !changes.assigneeId.trim())
  ) {
    return response(400, { message: "assigneeId must be a non-empty string" });
  }
  if ("deadline" in changes && typeof changes.deadline !== "string") {
    return response(400, { message: "deadline must be a date string" });
  }

  // updatedBy lets the notification email say who made the change.
  const names = { "#updatedAt": "updatedAt", "#updatedBy": "updatedBy" };
  const values = { ":updatedAt": new Date().toISOString(), ":updatedBy": userId };
  const assignments = ["#updatedAt = :updatedAt", "#updatedBy = :updatedBy"];

  for (const [index, [field, value]] of Object.entries(changes).entries()) {
    const name = `#field${index}`;
    const token = `:value${index}`;
    names[name] = field;
    values[token] = typeof value === "string" ? value.trim() : value;
    assignments.push(`${name} = ${token}`);
  }

  const updated = await dynamodb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { taskId },
      UpdateExpression: `SET ${assignments.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );
  return response(200, { task: updated.Attributes });
});
