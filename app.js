const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Helper function to safely handle formatting metrics without crashing the UI
function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// Master interface injector map targeting your exact lowercase database keys
function updateDashboardUI(data) {
    if (!data) return;
    
    // Convert hPa to standard US Inches of Mercury (inHg) formatted to 2 decimals
    const pressureInHg = data.pressure ? data.pressure * 0.0295301 : null;

    document.getElementById('temp-val').innerText = `${formatMetric(data.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(data.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
    document.getElementById('wind-val').innerText = `${formatMetric(data.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = data.wind_dir || "--";
    document.getElementById('rain-5min-val').innerText = `${formatMetric(data.rain_last_5_min, 3)} in`;
    document.getElementById('rain-today-val').innerText = `${formatMetric(data.rain_total_today, 3)} in`;
}

// Clear, direct API fetch call that pulls data straight from the cloud database
async function fetchCurrentWeatherData() {
    try {
        // Appending a timestamp query forces the browser to pull a fresh copy instead of loading old data
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json?nocache=${Date.now()}`);
        const currentReading = await response.json();
        
        if (currentReading) {
            updateDashboardUI(currentReading);
        }
    } catch (error) {
        console.error("Website failed to pull data from Firebase:", error);
    }
}

// 1. Fire the data request immediately on page boot to eliminate the loading lag
fetchCurrentWeatherData();

// 2. Automatically repeat the direct data pull every 4 seconds to catch live radio ticks
setInterval(fetchCurrentWeatherData, 4000);
