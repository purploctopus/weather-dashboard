const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize a Time-Series Area Chart with explicit Day-Level Axis constraints
    const rainChartOptions = {
        chart: {
            type: 'area',
            height: 300,
            toolbar: { show: true },
            background: '#1e1e1e',
            animations: { enabled: false } // Disabled to prevent drawing glitches over multi-day jumps
        },
        theme: { mode: 'dark' },
        colors: ['#3399ff'],
        series: [{ name: 'Daily Rainfall', data: [] }],
        xaxis: {
            type: 'datetime',
            tickPlacement: 'on',
            labels: {
                datetimeUTC: false,
                format: 'MMM dd', // Forces the bottom axis to display calendar dates (e.g. Jul 21, Jul 22)
            },
            axisBorder: { show: true, color: '#333' }
        },
        stroke: { curve: 'smooth', width: 3 },
        dataLabels: { enabled: false },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05 } },
        markers: {
            size: 5, // Adds a distinct visible dot on every calendar day so you see the individual totals
            colors: ['#3399ff'],
            strokeColors: '#1e1e1e',
            strokeWidth: 2
        },
        tooltip: { x: { format: 'MMM dd, yyyy' }, y: { formatter: (val) => `${val.toFixed(3)} in` } }
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
        
        document.getElementById('rain-5min-val').innerText = `${formatMetric(current.rain_last_5_min, 3)} in`;
        document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
        document.getElementById('rain-year-val').innerText = `${formatMetric(yearlyRainTotal, 3)} in`;
    }

    // 2. Data Analyst Core: Pull full directory history tree and isolate the current year
    async function loadPrecipitationAnalytics() {
        try {
            const yearlyTimelinePoints = [];
            let aggregatedYearTotal = 0.0;
            const currentYearPrefix = new Date().getFullYear().toString();

            // Fetch the comprehensive background database log history tree
            const fullHistoryResponse = await fetch(`${FIREBASE_DB_URL}history.json`);
            const fullHistory = await fullHistoryResponse.json();
            
            if (fullHistory) {
                // Read and sort all recorded date folder keys chronologically
                const sortedDates = Object.keys(fullHistory).sort();

                sortedDates.forEach(dateKey => {
                    // Process historical node strings matching the active calendar year folder prefix
                    if (dateKey.startsWith(currentYearPrefix)) {
                        let daySum = 0.0;
                        
                        // Sum up all 5-minute ticks recorded on this specific date
                        Object.values(fullHistory[dateKey]).forEach(row => {
                            const tip = Number(row.rain_last_5_min);
                            if (!isNaN(tip)) daySum += tip;
                        });

                        // Accumulate into the total year scale record register
                        aggregatedYearTotal += daySum;

                        // FIX: Parse the date splitting the string to prevent UTC timezone shifting leaks
                        const dateParts = dateKey.split('-');
                        const year = parseInt(dateParts[0], 10);
                        const month = parseInt(dateParts[1], 10) - 1; // JS Months are 0-11
                        const day = parseInt(dateParts[2], 10);
                        
                        // Creates the timestamp using strict local midnight time coordinates
                        const localMidnightTimestamp = new Date(year, month, day).getTime();
                        yearlyTimelinePoints.push([localMidnightTimestamp, daySum]);
                    }
                });
            }

            // Sync the entire timeline dataset array straight to the graph canvas
            rainChart.updateSeries([{ data: yearlyTimelinePoints }]);
            
            return aggregatedYearTotal;

        } catch (err) {
            console.error("Analytical calculation failure:", err);
            return 0.0;
        }
    }

    // 3. Real-Time Operational Pipeline Logic Loop Control
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

            const calculatedYearlyRain = await loadPrecipitationAnalytics();
            updateDashboardUI(currentData, calculatedDailyRain, calculatedYearlyRain);

        } catch (error) {
            console.error("Dashboard analysis pipeline failed:", error);
        }
    }

    runWeatherDashboardPipeline();
    setInterval(runWeatherDashboardPipeline, 4000);
});
