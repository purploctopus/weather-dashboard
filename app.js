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

// Clear, direct API request function
async function checkLiveWeatherData() {
    try {
        // Appending a random cache-busting timestamp query to guarantee the browser gets fresh data
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json?nocache=${Date.now()}`);
        const currentData = await response.json();
        if (currentData) {
            updateDashboardUI(currentData);
        }
    } catch (error) {
        console.error("Firebase cloud link dropped or failed:", error);
    }
}

// 1. Run the data fetch immediately the absolute millisecond the webpage boots
checkLiveWeatherData();

// 2. Automatically repeat the direct fetch request every 3 seconds to capture live radio ticks
setInterval(checkLiveWeatherData, 3000);

