import axios from "axios";
import dotenv from "dotenv";
import playSound from 'play-sound';

dotenv.config();

const player = playSound();

const clockifyBaseUrl = "https://api.clockify.me/api/v1";

const clockifyUserId = process.env.CLOCKIFY_USER_ID;
const clockifyWorkspaceId = process.env.CLOCKIFY_WORKSPACE_ID;
const clockifyApiKey = process.env.CLOCKIFY_API_KEY;


async function checkAndStopTimer() {
  try {
    // Получить текущий таймер
    const response = await axios.get(
      `${clockifyBaseUrl}/workspaces/${clockifyWorkspaceId}/user/${clockifyUserId}/time-entries`,
      { headers: { 'X-Api-Key': clockifyApiKey } }
    );

    const running = response.data.find(entry => !entry.timeInterval.end);
    if (running && (Date.now() - new Date(running.timeInterval.start).getTime()) > 25*60*1000) {
      // Остановить через API
      const endTime = new Date().toISOString();
      await axios.patch(
        `${clockifyBaseUrl}/workspaces/${clockifyWorkspaceId}/user/${clockifyUserId}/time-entries`,
        { end: endTime },
        { headers: { 'X-Api-Key': clockifyApiKey } }
      );
      console.log(`Timer stopped after 25 min: ${running.description}`);
      player.play('notification.wav', (err) => {
        if (err) console.error(err);
      });
    }

  } catch (error) {
    console.error('Error checking/stopping timer:', error.message);
    process.exit(1);
  }
}

// Run every 30 seconds
setInterval(checkAndStopTimer, 10 * 1000);

// Run immediately on start
checkAndStopTimer();
