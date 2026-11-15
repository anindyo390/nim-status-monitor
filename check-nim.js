const NIM_BASE = process.env.NIM_BASE_URL; // contoh: https://integrate.api.nvidia.com/v1
const NIM_KEY = process.env.NVIDIA_API_KEY;

const PAGE_ID = process.env.STATUSPAGE_PAGE_ID;
const API_KEY = process.env.STATUSPAGE_API_KEY;

// Daftar model yang ingin dipantau
const MODELS = [
  {
    name: "Nemotron 3.5 Super",
    modelId: process.env.MODEL_SUPER,
    componentId: process.env.COMPONENT_SUPER,
  },
  {
    name: "Nemotron 3.5 Ultra",
    modelId: process.env.MODEL_ULTRA,
    componentId: process.env.COMPONENT_ULTRA,
  },
];

async function checkModel(modelId) {
  try {
    const res = await fetch(`${NIM_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NIM_KEY}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 3,
      }),
      signal: AbortSignal.timeout(20000), // timeout 20 detik
    });

    if (res.ok) return "operational";
    if (res.status >= 500) return "major_outage";
    return "degraded_performance";
  } catch (err) {
    return "major_outage";
  }
}

async function updateComponent(componentId, status) {
  await fetch(
    `https://api.statuspage.io/v1/pages/${PAGE_ID}/components/${componentId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `OAuth ${API_KEY}`,
      },
      body: JSON.stringify({ component: { status } }),
    }
  );
}

(async () => {
  for (const m of MODELS) {
    const status = await checkModel(m.modelId);
    await updateComponent(m.componentId, status);
    console.log(`${m.name}: ${status}`);
  }
})();