import axios from "axios";
import clipboardy from "clipboardy";
import dotenv from "dotenv";

dotenv.config();

const clockifyBaseUrl = "https://api.clockify.me/api/v1";

// TODO: api is deprecated, use new api
const todoistBaseUrl = "https://api.todoist.com/rest/v2";

const clockifyUserId = process.env.CLOCKIFY_USER_ID;
const clockifyWorkspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
const clockifyApiKey = process.env.CLOCKIFY_API_KEY;
const todoistApiKey = process.env.TODOIST_API_KEY;
const todoistProjectId = process.env.TODOIST_PROJECT_ID;
const todoistEnabled = process.env.TODOIST_ENABLED !== "false";

const clockifyPath = `workspaces/${clockifyWorkspaceId}/user/${clockifyUserId}/time-entries?start=${lastWorkday().toISOString()}`;
const todoistTasksPath = `tasks?project_id=${todoistProjectId}`;

async function main() {
  const res = await axios.get(`${clockifyBaseUrl}/${clockifyPath}`, {
    headers: {
      "X-Api-Key": clockifyApiKey,
    },
  });

  const data = res.data;

  const done = clockifyReport(
    unique(data.reverse().map((item) => item.description))
  );
  const todo = todoistEnabled ? await getTodoistReport() : null;
  clipboardy.writeSync(markdownReport(done, todo));
  console.log("Report is copied to your clipboard successfully!");
}

main();

function markdownReport(done, todo) {
  const previousDate = formatDate(lastWorkday());
  const todoSection = todo !== null ? `\n\n**Что планирую:**\n${todo}` : "";
  return `**Отчёт за ${previousDate}:**\n${done}${todoSection}`;
}

function clockifyReport(arr) {
  return arr.map(markdownTask).join("\n\n");
}

function markdownTask(item) {
  // Jira-style key at start: letters/underscores, hyphen, digits (e.g. LND_CRMZ-1038 …)
  const jiraAtStart = /^\s*[A-Z][A-Z0-9_]*-\d+(?=\s|$)/.test(item);
  const legacyBracket = /\[[\w\d-]+/.test(item);
  if (jiraAtStart || legacyBracket) {
    return `- \`${item}\` - `;
  }

  return `- ${item}`;
}

function lastWorkday() {
  const date = new Date();
  date.setDate(date.getDate() - (date.getDay() === 1 ? 3 : 1));
  return date;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function unique(arr) {
  return arr.filter((v, i, a) => a.indexOf(v) === i);
}

async function getTodoistReport() {
  const res = await axios.get(`${todoistBaseUrl}/${todoistTasksPath}`, {
    headers: {
      Authorization: `Bearer ${todoistApiKey}`,
    },
  });

  const data = res.data;
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
