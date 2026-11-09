const { GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb, tableName, response, parseBody, withIdentity } = require("./lib");

// Task Assignment Lambda: PUT /tasks/{taskId}/assign
exports.handler = withIdentity("Assign task", async (event, userId, groups) => {
  if (!groups.includes("Admin")) {
    return response(403, { message: "Only Admins can assign tasks" });
  }

  const parsed = parseBody(event);
  if (parsed.error) return response(400, { message: parsed.error });

  const { assigneeId } = parsed.body;
  if (typeof assigneeId !== "string" || !assigneeId.trim()) {
    return response(400, { message: "assigneeId is required" });
  }

  const assignee = await dynamodb.send(
    new GetCommand({ TableName: process.env.USERS_TABLE, Key: { userId: assigneeId.trim() } }),
  );
  if (!assignee.Item) {
    return response(400, { message: "assigneeId is not a known user" });
  }

  try {
    const updated = await dynamodb.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { taskId: event.pathParameters.taskId },
        UpdateExpression: "SET assigneeId = :assigneeId, updatedAt = :now, updatedBy = :userId",
        ConditionExpression: "attribute_exists(taskId)",
        ExpressionAttributeValues: {
          ":assigneeId": assigneeId.trim(),
          ":now": new Date().toISOString(),
          ":userId": userId,
        },
        ReturnValues: "ALL_NEW",
      }),
    );
    return response(200, { task: updated.Attributes });
  } catch (error) {
    if (error.name === "ConditionalCheckFailedException") {
      return response(404, { message: "Task not found" });
    }
    throw error;
  }
});
