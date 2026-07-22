const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// Direct interface injector map
function updateDashboardUI(current, dailyRainTotal) {
    if (!current) return;
    
    const pressureInHg = current.pressure ? current.pressure * 0.0295301 : null;

    document.getElementById('temp-val').innerText = `${formatMetric(current.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(current.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
    document.getElementById('wind-val').innerText = `${formatMetric(current.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = current.wind_dir || "--";
    document.getElementById('rain-5min-val').innerText = `${formatMetric(current.rain_last_5_min, 3)} in`;
    
    // Injecting the analyst-side computed total instead of reading a hardcoded cloud value
    document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
}

// Master analytics extraction pipeline
async function runWeatherDashboardPipeline() {
    try {
        const cacheBuster = `?nocache=${Date.now()}`;
        
        // 1. Fetch instantaneous real-time metrics row
        const currentResponse = await fetch(`${FIREBASE_DB_URL}current_reading.json${cacheBuster}`);
        const currentData = await currentResponse.json();
        
        if (!currentData) return;

        // 2. Dynamically resolve today's date using the local browser clock
        const localDate = new Date();
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        const todayFolderKey = `${year}-${month}-${day}`;

        // 3. Query today's history directory tracking log entries
        const historyResponse = await fetch(`${FIREBASE_DB_URL}history/${todayFolderKey}.json${cacheBuster}`);
        const historyData = await historyResponse.json();

        let calculatedDailyRain = 0.0;

        // 4. Data Analyst Calculation Loop: Scan every log entry for today and sum the metrics
        if (historyData) {
            // Object.values converts the Firebase nested JSON map into a clean indexable array
            calculatedDailyRain = Object.values(historyData).reduce((total, logRow) => {
                const tip = Number(logRow.rain_last_5_min);
                return total + (isNaN(tip) ? 0 : tip);
            }, 0.0);
        }

        // 5. Package both direct metrics and client-computed calculations straight into the UI layout
        updateDashboardUI(currentData, calculatedDailyRain);

    } catch (error) {
        console.error("Dashboard analysis pipeline failed:", error);
    }
}

// Fire the analytical engine immediately on boot, then sweep for updates every 4 seconds
runWeatherDashboardPipeline();
setInterval(runWeatherDashboardPipeline, 4000);
