const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize the Historical Precipitation Bar Chart Instance
    const rainChartOptions = {
        chart: {
            type: 'bar',
            height: 300,
            toolbar: { show: true },
            background: '#1e1e1e'
        },
        theme: { mode: 'dark' },
        colors: ['#3399ff'],
        series: [{ name: 'Daily Rainfall', data: [] }],
        xaxis: {
            type: 'category',
            categories: [],
            axisBorder: { show: true, color: '#333' }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '40%',
                dataLabels: { position: 'top' }
            }
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${val.toFixed(3)} in`,
            style: { colors: ['#fff'], fontSize: '11px' },
            offsetY: -20
        },
        tooltip: { y: { formatter: (val) => `${val.toFixed(3)} in` } }
    };
    const rainChart = new ApexCharts(document.querySelector("#rain-bar-chart"), rainChartOptions);
    rainChart.render();

    function formatMetric(value, decimals, fallback = "--") {
        if (value === undefined || value === null) return fallback;
        const num = Number(value);
        return isNaN(num) ? value : num.toFixed(decimals);
    }

    // Defensive UI injector: Checks if any node is missing before injecting text
    function updateDashboardUI(current, dailyRainTotal, yearlyRainTotal) {
        if (!current) return;
        
        // Safety translation layer for barometric calculation
        const rawPressure = current.pressure;
        const pressureInHg = rawPressure ? rawPressure * 0.0295301 : null;

        document.getElementById('temp-val').innerText = `${formatMetric(current.temperature, 1)} °F`;
        document.getElementById('humid-val').innerText = `${formatMetric(current.humidity, 1)} %`;
        document.getElementById('press-val').innerText = `${formatMetric(pressureInHg, 2)} inHg`;
        document.getElementById('wind-val').innerText = `${formatMetric(current.wind_speed, 1)} MPH`;
        document.getElementById('dir-val').innerText = current.wind_dir || "--";
        
        // Handle variations in rainfall key mapping defensively
        const instantRain = current.rain_last_5_min !== undefined ? current.rain_last_5_min : current.rain_fall;
        document.getElementById('rain-5min-val').innerText = `${formatMetric(instantRain, 3)} in`;
        document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
        document.getElementById('rain-year-val').innerText = `${formatMetric(yearlyRainTotal, 3)} in`;
    }

    // 2. Data Analyst Core: Compile a single aggregated total per unique date string
    async function loadPrecipitationAnalytics() {
        try {
            const dailyRainTotalsArray = [];
            const dateLabelsArray = [];
            let aggregatedYearTotal = 0.0;
            const currentYearPrefix = new Date().getFullYear().toString();

            const fullHistoryResponse = await fetch(`${FIREBASE_DB_URL}history.json`);
            const fullHistory = await fullHistoryResponse.json();
            
            if (fullHistory) {
                const sortedDates = Object.keys(fullHistory).sort();

                sortedDates.forEach(dateKey => {
                    if (dateKey.startsWith(currentYearPrefix)) {
                        let daySum = 0.0;
                        
                        Object.values(fullHistory[dateKey]).forEach(row => {
                            // Extract values supporting both naming patterns flexibly
                            const tip = row.rain_last_5_min !== undefined ? Number(row.rain_last_5_min) : Number(row.rain_fall);
                            if (!isNaN(tip)) daySum += tip;
                        });

                        aggregatedYearTotal += daySum;

                        dailyRainTotalsArray.push(Number(daySum.toFixed(3)));
                        const shortDate = dateKey.substring(5);
                        dateLabelsArray.push(shortDate);
                    }
                });
            }

            rainChart.updateSeries([{ data: dailyRainTotalsArray }]);
            rainChart.updateOptions({ xaxis: { categories: dateLabelsArray } });
            
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
                    const tip = logRow.rain_last_5_min !== undefined ? Number(logRow.rain_last_5_min) : Number(logRow.rain_fall);
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
