const axios = require("axios");

async function triggerJadwalWebhook(payload) {
  if (!process.env.N8N_WEBHOOK_SCHEDULE_URL) {
    throw new Error("N8N_WEBHOOK_JADWAL_URL belum diset");
  }

  return axios.post(
    process.env.N8N_WEBHOOK_SCHEDULE_URL,
    payload,
    { timeout: 5000 }
  );
}

module.exports = { triggerJadwalWebhook };
