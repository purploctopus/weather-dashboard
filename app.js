// Replace with your exact Firebase database URL string (leave the trailing slash)
const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// Master interface injector map
function updateDashboardUI(metrics) {
    if (!metrics) return;
    
    document.getElementById('temp-val').innerText = `${formatMetric(metrics.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(metrics.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(metrics.pressure, 1)} hPa`;
    document.getElementById('wind-val').innerText = `${formatMetric(metrics.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = metrics.wind_dir || "--";
    document.getElementById('rain-val').innerText = `${formatMetric(metrics.rain_fall, 3)} in`;
}

// 1. Fetch direct snapshot immediately on boot to handle instant loading
async function loadInstantBaseline() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json`);
        const initialData = await response.json();
        if (initialData) {
            updateDashboardUI(initialData);
        }
    } catch (error) {
        console.error("Baseline fetch failed:", error);
    }
}
loadInstantBaseline();

// 2. Open the streaming connection and correctly extract the nested data updates
const eventSource = new EventSource(`${FIREBASE_DB_URL}current_reading.json`);
eventSource.onmessage = function(event) {
    try {
        const payload = JSON.parse(event.data);
        if (!payload) return;

        // Firebase EventSource puts the actual metrics inside the 'data' field of the stream wrapper
        if (payload.data) {
            updateDashboardUI(payload.data);
        } else if (payload.path === "/" && payload.data === null) {
            console.log("Waiting for fresh database write ticker...");
        }
    } catch (err) {
        console.error("Stream parsing block error:", err);
    }
};
