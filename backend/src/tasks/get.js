const { response, hasTaskRole, canAccessTask, findTask, withIdentity } = require("./lib");

// GET /tasks/{taskId}: Admins, or the assigned Team Member
exports.handler = withIdentity("Get task", async (event, userId, groups) => {
  if (!hasTaskRole(groups)) {
    return response(403, { message: "User has no task role" });
  }

  const task = await findTask(event.pathParameters.taskId);
  if (!task) return response(404, { message: "Task not found" });
  if (!canAccessTask(task, userId, groups)) {
    return response(403, { message: "You cannot view this task" });
  }
  return response(200, { task });
});
