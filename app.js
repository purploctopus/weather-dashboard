const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// Master interface injector map matching your exact Firebase console keys
function updateDashboardUI(metrics) {
    if (!metrics) return;
    
    // Convert hPa to standard US Inches of Mercury (inHg) formatted to 2 decimals
    const pressureInHg = metrics.pressure * 0.0295301;
    
    document.getElementById('temp-val').innerText = `${formatMetric(metrics.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(metrics.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
    document.getElementById('wind-val').innerText = `${formatMetric(metrics.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = metrics.wind_dir || "--";
    document.getElementById('rain-5min-val').innerText = `${formatMetric(metrics.rain_last_5_min, 3)} in`;
    document.getElementById('rain-today-val').innerText = `${formatMetric(metrics.rain_total_today, 3)} in`;
}

// Clear, direct high-speed polling request
async function checkLiveWeatherData() {
    try {
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json?nocache=${Date.now()}`);
        const currentData = await response.json();
        if (currentData) {
            updateDashboardUI(currentData);
        }
    } catch (error) {
        console.error("Firebase cloud pull dropped:", error);
    }
}

// Fire immediately on load, then loop every 3 seconds to capture live radio shifts
checkLiveWeatherData();
setInterval(checkLiveWeatherData, 3000);
