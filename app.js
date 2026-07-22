const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Wait for the browser to draw all HTML containers before running any chart logic
document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize the Historical Precipitation Bar Chart Instance
    const rainChartOptions = {
        chart: { type: 'bar', height: 300, toolbar: { show: false }, background: '#1e1e1e' },
        theme: { mode: 'dark' },
        colors: ['#3399ff'],
        series: [{ name: 'Daily Rain', data: [0,0,0,0,0,0,0] }],
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        plotOptions: { bar: { borderRadius: 4, dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(2)} in`, style: { colors: ['#fff'] } }
    };
    const rainChart = new ApexCharts(document.querySelector("#rain-bar-chart"), rainChartOptions);
    rainChart.render();

    function formatMetric(value, decimals, fallback = "--") {
        if (value === undefined || value === null) return fallback;
        const num = Number(value);
        return isNaN(num) ? value : num.toFixed(decimals);
    }

    function updateDashboardUI(current, dailyRainTotal, yearlyRainTotal) {
        if (!current) return;
        const pressureInHg = current.pressure ? current.pressure * 0.0295301 : null;

        document.getElementById('temp-val').innerText = `${formatMetric(current.temperature, 1)} °F`;
        document.getElementById('humid-val').innerText = `${formatMetric(current.humidity, 1)} %`;
        document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
        document.getElementById('wind-val').innerText = `${formatMetric(current.wind_speed, 1)} MPH`;
        document.getElementById('dir-val').innerText = current.wind_dir || "--";
        
        // Injecting Precipitation Module Parameters
        document.getElementById('rain-5min-val').innerText = `${formatMetric(current.rain_last_5_min, 3)} in`;
        document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
        document.getElementById('rain-year-val').innerText = `${formatMetric(yearlyRainTotal, 3)} in`;
    }

    // 2. Data Analyst Core: Mine deep database logs to calculate Year and Week values
    async function loadPrecipitationAnalytics() {
        try {
            const last7DaysData = [];
            const labelDates = [];
            let aggregatedYearTotal = 0.0;
            
            // Loop over past 7 calendar dates for chart values
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                
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

            // Fetch the global history folder to calculate the absolute Year Total on the fly
            const fullHistoryResponse = await fetch(`${FIREBASE_DB_URL}history.json`);
            const fullHistory = await fullHistoryResponse.json();
            
            if (fullHistory) {
                // Loop through every date folder logged in your database history tree
                Object.keys(fullHistory).forEach(dateKey => {
                    const currentYearPrefix = new Date().getFullYear().toString();
                    if (dateKey.startsWith(currentYearPrefix)) { // Only count logs for the current year
                        Object.values(fullHistory[dateKey]).forEach(row => {
                            const tip = Number(row.rain_last_5_min);
                            if (!isNaN(tip)) aggregatedYearTotal += tip;
                        });
                    }
                });
            }

            // Render weekly array bars onto the canvas map [Ref: 1.3.7]
            rainChart.updateSeries([{ data: last7DaysData }]);
            rainChart.updateOptions({ xaxis: { categories: labelDates } });
            
            return aggregatedYearTotal;

        } catch (err) {
            console.error("Analytical calculation failure:", err);
            return 0.0;
        }
    }

    // 3. Main Real-Time Operational Pipeline Loop
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

            // Run historical calculations and return year totals
            const calculatedYearlyRain = await loadPrecipitationAnalytics();

            // Push calculations straight down to text templates
            updateDashboardUI(currentData, calculatedDailyRain, calculatedYearlyRain);

        } catch (error) {
            console.error("Dashboard analysis pipeline failed:", error);
        }
    }

    // Initialize immediate execution loops on document verification
    runWeatherDashboardPipeline();
    setInterval(runWeatherDashboardPipeline, 4000);
});
