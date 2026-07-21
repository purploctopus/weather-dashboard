// Replace with your exact Firebase database URL string (leave the trailing slash)
const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Main execution function that runs immediately when the page loads
async function fetchCurrentWeatherData() {
    try {
        // Fetching directly from the JSON endpoint to bypass streaming handshakes
        const response = await fetch(`${FIREBASE_DB_URL}current_reading.json`);
        const data = await response.json();
        
        if (!data) return;

        // Mapping to your exact lowercase database keys shown in your console image
        document.getElementById('temp-val').innerText = `${data.temperature} °F`;
        document.getElementById('humid-val').innerText = `${data.humidity} %`;
        document.getElementById('wind-val').innerText = `${data.wind_speed} MPH`;
        document.getElementById('rain-val').innerText = `${data.rain_fall} in`;
        
    } catch (error) {
        console.error("Error loading weather metrics:", error);
    }
}

// Run immediately on page load to eliminate the 1-minute loading stall
fetchCurrentWeatherData();

// Check for live updates every 5 seconds to keep it fresh automatically
setInterval(fetchCurrentWeatherData, 5000);

