const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

function formatMetric(value, decimals, fallback = "--") {
    if (value === undefined || value === null) return fallback;
    const num = Number(value);
    return isNaN(num) ? value : num.toFixed(decimals);
}

// 1. Initialize the Historical Precipitation Bar Chart
const rainChartOptions = {
    chart: { type: 'bar', height: 300, toolbar: { show: false }, background: '#1e1e1e' },
    theme: { mode: 'dark' },
    colors: ['#3399ff'],
    series: [{ name: 'Daily Rain', data: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0] }],
    xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
    dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(2)} in`, style: { colors: ['#fff'] } }
};
const rainChart = new ApexCharts(document.querySelector("#rain-bar-chart"), rainChartOptions);
rainChart.render();

function updateDashboardUI(current, dailyRainTotal) {
    if (!current) return;
    const pressureInHg = current.pressure ? current.pressure * 0.0295301 : null;

    document.getElementById('temp-val').innerText = `${formatMetric(current.temperature, 1)} °F`;
    document.getElementById('humid-val').innerText = `${formatMetric(current.humidity, 1)} %`;
    document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
    document.getElementById('wind-val').innerText = `${formatMetric(current.wind_speed, 1)} MPH`;
    document.getElementById('dir-val').innerText = current.wind_dir || "--";
    
    // Inject variables safely into your new precipitation panel nodes
    document.getElementById('rain-5min-val').innerText = `${formatMetric(current.rain_last_5_min, 3)} in`;
    document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
}

// 2. Query and Sum Past Days to Populate the Graph
async function loadHistoricalRainGraph() {
    try {
        const last7DaysData = [];
        const labelDates = [];
        
        // Scan backwards through the last 7 calendar dates
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            // Format clean, universal weekday initials for display labels
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
            labelDates.push(dayLabel);

            const res = await fetch(`${FIREBASE_DB_URL}history/${dateStr}.json`);
            const historyNode = await res.json();
            
            let daySum = 0.0;
            if (historyNode) {
                daySum = Object.values(historyNode).reduce((total, row) => {
                    const tip = Number(row.rain_last_5_min);
                    return total + (isNaN(tip) ? 0 : tip);
                }, 0.0);
            }
            last7DaysData.push(daySum);
        }

        // Render the calculated historical volumes directly onto the graph canvas layout
        rainChart.updateSeries([{ data: last7DaysData }]);
        rainChart.updateOptions({ xaxis: { categories: labelDates } });

    } catch (err) {
        console.error("Failed loading precipitation analytics history:", err);
    }
}

// 3. Real-Time Operational Pipeline Control Hub
async function runWeatherDashboardPipeline() {
    try {
        const cacheBuster = `?nocache=${Date.now()}`;
        const currentResponse = await fetch(`${FIREBASE_DB_URL}current_reading.json${cacheBuster}`);
        const currentData = await currentResponse.json();
        
        if (!currentData) return;

        const localDate = new Date();
        const todayFolderKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

        const historyResponse = await fetch(`${FIREBASE_DB_URL}history/${todayFolderKey}.json${cacheBuster}`);
        const historyData = await historyResponse.json();

        let calculatedDailyRain = 0.0;
        if (historyData) {
            calculatedDailyRain = Object.values(historyData).reduce((total, logRow) => {
                const tip = Number(logRow.rain_last_5_min);
                return total + (isNaN(tip) ? 0 : tip);
            }, 0.0);
        }

        updateDashboardUI(currentData, calculatedDailyRain);

    } catch (error) {
        console.error("Dashboard analysis pipeline failed:", error);
    }
}

// Run baseline snapshot queries immediately on initialization
runWeatherDashboardPipeline();
loadHistoricalRainGraph();

// Loop real-time metrics every 4 seconds, refresh historical chart every 10 minutes
setInterval(runWeatherDashboardPipeline, 4000);
setInterval(loadHistoricalRainGraph, 600000);
