async function callN8nGrowthWorkflow({ anakId, sex, dobYYYYMMDD, measurementYYYYMMDD, heightCm }) {
  if (!process.env.N8N_WEBHOOK_GROWTH_URL) {
    throw new Error("N8N_WEBHOOK_URL is not set");
  }

  const payload = {
    child: {
      anakId,
      sex, // "M" or "F"
      dob: dobYYYYMMDD, // "YYYY-MM-DD"
      measurementDate: measurementYYYYMMDD, // "YYYY-MM-DD"
      heightCm, // number
    },
  };

  const res = await fetch(process.env.N8N_WEBHOOK_GROWTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`n8n call failed: ${res.status} ${res.statusText} ${text}`);
  }

  const data = await res.json();

  // expected: { classification: "...", nutritionPlan: "..." }
  if (!data?.classification || !data?.nutritionPlan) {
    throw new Error("n8n response missing classification/nutritionPlan");
  }

  return { classification: data.classification, nutritionPlan: data.nutritionPlan };
}

module.exports = { callN8nGrowthWorkflow };
