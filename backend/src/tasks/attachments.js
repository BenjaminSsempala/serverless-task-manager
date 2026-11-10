const { randomUUID } = require("node:crypto");
const { GetObjectCommand, ListObjectsV2Command, S3Client } = require("@aws-sdk/client-s3");
const { createPresignedPost } = require("@aws-sdk/s3-presigned-post");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { response, hasTaskRole, parseBody, canAccessTask, findTask, withIdentity } = require("./lib");

const s3 = new S3Client({});
const bucket = process.env.ATTACHMENTS_BUCKET;
const maxBytes = 10 * 1024 * 1024; // 10 MB
const urlLifetimeSeconds = 300; // 5 minutes

// Files live under tasks/{taskId}/{uuid}/{fileName}
const taskPrefix = (taskId) => `tasks/${taskId}/`;
const safeFileName = (name) => name.replace(/[^\w.\- ]/g, "_").slice(0, 150);

// POST: returns a presigned upload. S3 itself enforces the size limit and exact key.
async function createUpload(event, taskId) {
  const parsed = parseBody(event);
  if (parsed.error) return response(400, { message: parsed.error });

  const { fileName, contentType = "application/octet-stream", size } = parsed.body;
  if (typeof fileName !== "string" || !fileName.trim()) {
    return response(400, { message: "fileName is required" });
  }
  if (typeof size !== "number" || size <= 0 || size > maxBytes) {
    return response(400, { message: "size must be between 1 byte and 10 MB" });
  }

  const key = `${taskPrefix(taskId)}${randomUUID()}/${safeFileName(fileName.trim())}`;
  const upload = await createPresignedPost(s3, {
    Bucket: bucket,
    Key: key,
    Conditions: [["content-length-range", 1, maxBytes]],
    Fields: { "Content-Type": contentType },
    Expires: urlLifetimeSeconds,
  });
  return response(200, { upload, key });
}

// GET: lists the task's files with short-lived download links.
async function listAttachments(taskId) {
  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: taskPrefix(taskId) }),
  );
  const attachments = await Promise.all(
    (result.Contents ?? []).map(async (object) => {
      const fileName = object.Key.split("/").pop();
      return {
        key: object.Key,
        fileName,
        size: object.Size,
        uploadedAt: object.LastModified,
        url: await getSignedUrl(
          s3,
          new GetObjectCommand({
            Bucket: bucket,
            Key: object.Key,
            ResponseContentDisposition: `attachment; filename="${fileName}"`,
          }),
          { expiresIn: urlLifetimeSeconds },
        ),
      };
    }),
  );
  return response(200, { attachments });
}

// /tasks/{taskId}/attachments: Admins, or the task's assignee
exports.handler = withIdentity("Attachments", async (event, userId, groups) => {
  if (!hasTaskRole(groups)) {
    return response(403, { message: "User has no task role" });
  }

  const taskId = event.pathParameters.taskId;
  const task = await findTask(taskId);
  if (!task) return response(404, { message: "Task not found" });
  if (!canAccessTask(task, userId, groups)) {
    return response(403, { message: "You cannot access this task's attachments" });
  }

  return event.httpMethod === "POST" ? createUpload(event, taskId) : listAttachments(taskId);
});
