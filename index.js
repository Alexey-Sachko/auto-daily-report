import fetch from "node-fetch";
import clipboardy from "clipboardy";
import dotenv from "dotenv";

dotenv.config();

const clockifyBaseUrl = "https://api.clockify.me/api/v1";
const todoistBaseUrl = "https://api.todoist.com/rest/v2";

const clockifyUserId = process.env.CLOCKIFY_USER_ID;
const clockifyWorkspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
const clockifyApiKey = process.env.CLOCKIFY_API_KEY;
const todoistApiKey = process.env.TODOIST_API_KEY;
const todoistProjectId = process.env.TODOIST_PROJECT_ID;

const clockifyPath = `workspaces/${clockifyWorkspaceId}/user/${clockifyUserId}/time-entries?start=${lastWorkday().toISOString()}`;
const todoistTasksPath = `tasks?project_id=${todoistProjectId}`;

async function main() {
  const res = await fetch(`${clockifyBaseUrl}/${clockifyPath}`, {
    headers: {
      "X-Api-Key": clockifyApiKey,
    },
  });

  const data = await res.json();

  const done = clockifyReport(
    unique(data.reverse().map((item) => item.description))
  );
  const todo = await getTodoistReport();
  clipboardy.writeSync(markdownReport(done, todo));
  console.log("Report is copied to your clipboard successfully!");
}

main();

function markdownReport(done, todo) {
  return `**Что делал:**\n${done}\n\n**Что планирую:**\n${todo}`;
}

function clockifyReport(arr) {
  return arr.map(markdownTask).join("\n");
}

function markdownTask(item) {
  if (/\[[\w\d-]+/.test(item)) {
    return `- \`${item}\` - `;
  }

  return `- ${item}`;
}

function lastWorkday() {
  const date = new Date();
  date.setDate(date.getDate() - (date.getDay() === 1 ? 3 : 1));
  return date;
}

function unique(arr) {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
}

async function getTodoistReport() {
  const res = await fetch(`${todoistBaseUrl}/${todoistTasksPath}`, {
    headers: {
      Authorization: `Bearer ${todoistApiKey}`,
    },
  });

  const data = await res.json();
  return data
    .filter(
      ({ due, is_completed }) => due && isToday(due.date) && !is_completed
    )
    .map(({ content }) => `- ${content}`)
    .join("\n");
}

function isToday(dateString) {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}
