const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TASKS_TABLE;
const validStatuses = new Set(["TODO", "IN_PROGRESS", "COMPLETED"]);

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);
let requestOrigin = "";

function response(statusCode, body) {
  const headers = { "Content-Type": "application/json" };
  // Echo the caller's origin only if it is on the allowlist.
  if (allowedOrigins.includes(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers.Vary = "Origin";
  }
  return { statusCode, headers, body: JSON.stringify(body) };
}

function getIdentity(event) {
  const claims = event.requestContext?.authorizer?.claims ?? {};
  const rawGroups = claims["cognito:groups"] ?? "";
  // Groups can arrive as an array, "Admin,TeamMember" or "[Admin TeamMember]".
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : rawGroups.replace(/[\[\]]/g, "").split(/[,\s]+/).filter(Boolean);

  return { userId: claims.sub, groups };
}

function hasTaskRole(groups) {
  return groups.includes("Admin") || groups.includes("TeamMember");
}

function parseBody(event) {
  try {
    const rawBody = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body || "{}";
    return { body: JSON.parse(rawBody) };
  } catch {
    return { error: "Request body must be valid JSON" };
  }
}

function canAccessTask(task, userId, groups) {
  return groups.includes("Admin") || task.assigneeId === userId;
}

async function findTask(taskId) {
  const result = await dynamodb.send(
    new GetCommand({ TableName: tableName, Key: { taskId } }),
  );
  return result.Item;
}

// Wraps a route handler with identity checks and error handling shared by every Lambda.
function withIdentity(name, route) {
  return async (event) => {
    requestOrigin = event.headers?.origin ?? event.headers?.Origin ?? "";
    try {
      const { userId, groups } = getIdentity(event);
      if (!userId) return response(401, { message: "User identity is missing" });
      return await route(event, userId, groups);
    } catch (error) {
      console.error(`${name} error:`, error);
      return response(500, { message: "Internal server error" });
    }
  };
}

module.exports = {
  dynamodb,
  tableName,
  validStatuses,
  response,
  hasTaskRole,
  parseBody,
  canAccessTask,
  findTask,
  withIdentity,
};
