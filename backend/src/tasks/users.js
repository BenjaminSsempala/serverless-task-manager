const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { dynamodb, response, withIdentity } = require("./lib");

// GET /users: lets Admins choose an assignee (Admin only)
exports.handler = withIdentity("List users", async (event, userId, groups) => {
  if (!groups.includes("Admin")) {
    return response(403, { message: "Only Admins can list users" });
  }

  const result = await dynamodb.send(
    new ScanCommand({
      TableName: process.env.USERS_TABLE,
      ProjectionExpression: "userId, #name, email, #role",
      ExpressionAttributeNames: { "#name": "name", "#role": "role" },
    }),
  );
  const users = (result.Items ?? []).sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email),
  );
  return response(200, { users });
});
