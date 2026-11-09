const { unmarshall } = require("@aws-sdk/util-dynamodb");
const { statusLabel, findUser, displayName, formatDeadline, publish, taskDetails } = require("./email");

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
