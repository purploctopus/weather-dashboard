// Replace with your exact Firebase database URL string (leave the trailing slash)
const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Helper function to safely parse values and apply decimals without breaking the UI
function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// Master interface injector map
function updateDashboardUI(data) {
    if (!data) return;
    
    // Using the helper to ensure strings, numbers, or null values never crash the script
    document.getElementById('temp-val').innerText = `${formatMetric(data.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(data.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(data.pressure, 1)} hPa`;
    document.getElementById('wind-val').innerText = `${formatMetric(data.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = data.wind_dir || "--";
    document.getElementById('rain-val').innerText = `${formatMetric(data.rain_fall, 3)} in`;
}

// 1. Instant Data Pull Loop (Bypasses initial 60-second streaming lag)
async function loadInstantBaseline() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json`);
        const data = await response.json();
        if (data) {
            updateDashboardUI(data);
        }
    } catch (error) {
        console.error("Cloud data connection error:", error);
    }
}
loadInstantBaseline();

// 2. Continuous Persistent Real-Time Stream (Catches incoming LoRa ticks)
const eventSource = new EventSource(`${FIREBASE_DB_URL}current_reading.json`);
eventSource.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data) {
        updateDashboardUI(data);
    }
};
