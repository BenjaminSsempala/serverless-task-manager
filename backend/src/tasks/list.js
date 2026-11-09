const { QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb, tableName, response, hasTaskRole, withIdentity } = require("./lib");

// GET /tasks: all tasks for Admins, assigned tasks for Team Members
exports.handler = withIdentity("List tasks", async (event, userId, groups) => {
  if (!hasTaskRole(groups)) {
    return response(403, { message: "User has no task role" });
  }

  if (groups.includes("Admin")) {
    const result = await dynamodb.send(new ScanCommand({ TableName: tableName }));
    return response(200, { tasks: result.Items ?? [] });
  }

  const result = await dynamodb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "AssigneeIndex",
      KeyConditionExpression: "assigneeId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    }),
  );
  return response(200, { tasks: result.Items ?? [] });
});
