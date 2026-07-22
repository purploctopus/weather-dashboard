const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize the Historical Precipitation Bar Chart Instance
    const rainChartOptions = {
        chart: { type: 'bar', height: 300, toolbar: { show: true }, background: '#1e1e1e' },
        theme: { mode: 'dark' },
        colors: ['#3399ff'],
        series: [{ name: 'Daily Rainfall', data: [] }],
        xaxis: { type: 'category', categories: [], axisBorder: { show: true, color: '#333' } },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%', dataLabels: { position: 'top' } } },
        dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(3)} in`, style: { colors: ['#fff'], fontSize: '11px' }, offsetY: -20 },
        tooltip: { y: { formatter: (val) => `${val.toFixed(3)} in` } }
    };
    const rainChart = new ApexCharts(document.querySelector("#rain-bar-chart"), rainChartOptions);
    rainChart.render();

    // 2. Initialize High-Resolution 5-Minute Temperature Timeline Chart
    const tempChartOptions = {
        chart: { type: 'area', height: 300, toolbar: { show: true }, background: '#1e1e1e', animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: ['#00ffcc'],
        series: [{ name: 'Temperature', data: [] }],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        // === FIX: Disables connecting lines over missing time gaps ===
        stroke: { curve: 'smooth', width: 3, connectNulls: false },
        dataLabels: { enabled: false },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
        tooltip: { x: { format: 'hh:mm TT' }, y: { formatter: (val) => `${val.toFixed(1)} °F` } }
    };
    const tempChart = new ApexCharts(document.querySelector("#temp-timeline-chart"), tempChartOptions);
    tempChart.render();

    // 3. Initialize High-Resolution 5-Minute Barometric Pressure Timeline Chart
    const pressChartOptions = {
        chart: { type: 'area', height: 300, toolbar: { show: true }, background: '#1e1e1e', animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: ['#ff9900'],
        series: [{ name: 'Pressure', data: [] }],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        // === FIX: Disables connecting lines over missing time gaps ===
        stroke: { curve: 'smooth', width: 3, connectNulls: false },
        dataLabels: { enabled: false },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
        tooltip: { x: { format: 'hh:mm TT' }, y: { formatter: (val) => `${val.toFixed(2)} inHg` } }
    };
    const pressChart = new ApexCharts(document.querySelector("#press-timeline-chart"), pressChartOptions);
    pressChart.render();

    // 4. Initialize High-Resolution 5-Minute Humidity Timeline Chart
    const humidChartOptions = {
        chart: { type: 'area', height: 300, toolbar: { show: true }, background: '#1e1e1e', animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: ['#b366ff'],
        series: [{ name: 'Humidity', data: [] }],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        // === FIX: Disables connecting lines over missing time gaps ===
        stroke: { curve: 'smooth', width: 3, connectNulls: false },
        dataLabels: { enabled: false },
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 } },
        tooltip: { x: { format: 'hh:mm TT' }, y: { formatter: (val) => `${val.toFixed(1)} %` } }
    };
    const humidChart = new ApexCharts(document.querySelector("#humid-timeline-chart"), humidChartOptions);
    humidChart.render();
    
    // 5. Initialize High-Resolution 5-Minute Dual Wind Analytics Chart
    const windSpeedChartOptions = {
        chart: { type: 'area', height: 300, toolbar: { show: true }, background: '#1e1e1e', animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: ['#ff5050', '#ff9999'], // Bright red for Gusts, lighter coral red for Average Speed
        // === UPDATED: Multi-series data tracking layers ===
        series: [
            { name: 'Peak Wind Gust', data: [] },
            { name: 'Average Wind Speed', data: [] }
        ],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        stroke: { curve: 'smooth', width:, connectNulls: false }, // Thicker line for gusts, thinner for average
        dataLabels: { enabled: false },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: [0.2, 0.05], opacityTo: [0.01, 0.0] }
        },
        tooltip: { x: { format: 'hh:mm TT' }, y: { formatter: (val) => `${val.toFixed(1)} MPH` } }
    };
    const windSpeedChart = new ApexCharts(document.querySelector("#wind-speed-chart"), windSpeedChartOptions);
    windSpeedChart.render();

    // 6. Initialize Chronological 5-Minute Wind Direction Timeline Chart
    const windDirChartOptions = {
        chart: { type: 'scatter', height: 300, toolbar: { show: true }, background: '#1e1e1e', animations: { enabled: false } },
        theme: { mode: 'dark' },
        colors: ['#e6a23c'],
        series: [{ name: 'Wind Direction', data: [] }],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        yaxis: {
            tickAmount: 7,
            min: 0,
            max: 7,
            labels: {
                style: { colors: '#8e8e93' },
                formatter: function(val) {
                    const compassMap = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                    return compassMap[Math.round(val)] || "";
                }
            }
        },
        markers: { size: 6, strokeWidth: 0 },
        tooltip: {
            x: { format: 'hh:mm TT' },
            y: { formatter: (val) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(val)] }
        }
    };
    const windDirChart = new ApexCharts(document.querySelector("#wind-dir-timeline-chart"), windDirChartOptions);
    windDirChart.render();

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
        
        // NEW INJECTION ROW: Map your new peak gust database element
        document.getElementById('gust-val').innerText = `${formatMetric(current.wind_gust, 1)} MPH`;
        
        document.getElementById('dir-val').innerText = current.wind_dir || "--";
        document.getElementById('rain-5min-val').innerText = `${formatMetric(current.rain_last_5_min, 3)} in`;
        document.getElementById('rain-today-val').innerText = `${formatMetric(dailyRainTotal, 3)} in`;
        document.getElementById('rain-year-val').innerText = `${formatMetric(yearlyRainTotal, 3)} in`;
    }

    // 5. Precipitation Database Mining Loop
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

    // 6. Main Real-Time Operational Pipeline Loop
    async function runWeatherDashboardPipeline() {
        try {
            const cacheBuster = `?nocache=${Date.now()}`;
            const currentResponse = await fetch(`${FIREBASE_DB_URL}current_reading.json${cacheBuster}`);
            const currentData = await currentResponse.json();
            
            if (!currentData) return;

            const localDate = new Date();
            const yearStr = localDate.getFullYear();
            const monthStr = String(localDate.getMonth() + 1).padStart(2, '0');
            const dayStr = String(localDate.getDate()).padStart(2, '0');
            const todayFolderKey = `${yearStr}-${monthStr}-${dayStr}`;

            const historyResponse = await fetch(`${FIREBASE_DB_URL}history/${todayFolderKey}.json${cacheBuster}`);
            const historyData = await historyResponse.json();

            let calculatedDailyRain = 0.0;
            const tempTimelinePoints = [];
            const pressTimelinePoints = [];
            const humidTimelinePoints = [];
            const windSpeedTimelinePoints = [];
            const windGustTimelinePoints = [];
            const windDirTimelinePoints = [];


            if (historyData) {
                const dateParts = todayFolderKey.split('-');
                const chartYear = parseInt(dateParts[0], 10);
                const chartMonth = parseInt(dateParts[1], 10) - 1;
                const chartDay = parseInt(dateParts[2], 10);

                const seenTimestamps = new Set();

                // === FIX: Force keys into true numeric chronological order ===
                const sortedTimeKeys = Object.keys(historyData).sort((a, b) => {
                    return parseInt(a, 10) - parseInt(b, 10);
                });
                // ==============================================================

                // Change Object.entries(historyData).forEach to loop through our sorted array keys instead
                sortedTimeKeys.forEach(timeKey => {
                    const logRow = historyData[timeKey];
                    if (!logRow) return;

                    const tip = logRow.rain_last_5_min !== undefined ? Number(logRow.rain_last_5_min) : Number(logRow.rain_fall);
                    calculatedDailyRain += (isNaN(tip) ? 0 : tip);

                    const paddedTimeKey = timeKey.padStart(6, '0');
                    const hh = parseInt(paddedTimeKey.substring(0, 2), 10);
                    const mm = parseInt(paddedTimeKey.substring(2, 4), 10);
                    const ss = parseInt(paddedTimeKey.substring(4, 6), 10);
                    
                    const preciseLocalTimestamp = new Date(chartYear, chartMonth, chartDay, hh, mm, ss).getTime();

                    if (!seenTimestamps.has(preciseLocalTimestamp)) {
                        seenTimestamps.add(preciseLocalTimestamp);

                        const temp = Number(logRow.temperature);
                        if (!isNaN(temp)) tempTimelinePoints.push([preciseLocalTimestamp, temp]);

                        const press = Number(logRow.pressure);
                        if (!isNaN(press)) pressTimelinePoints.push([preciseLocalTimestamp, press * 0.0295301]);

                        const humid = Number(logRow.humidity);
                        if (!isNaN(humid)) humidTimelinePoints.push([preciseLocalTimestamp, humid]);
                        
                        // Extract True 5-Minute Average Wind Speed Data Point
                        const speed = Number(logRow.wind_speed);
                        if (!isNaN(speed)) windSpeedTimelinePoints.push([preciseLocalTimestamp, speed]);

                        // NEW: Extract 5-Second Peak Wind Gust Data Point
                        const gust = Number(logRow.wind_gust);
                        if (!isNaN(gust)) windGustTimelinePoints.push([preciseLocalTimestamp, gust]);

                        const direction = logRow.wind_dir;
                        const compassMap = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
                        const dirIndex = compassMap.indexOf(direction);
                        if (dirIndex !== -1) windDirTimelinePoints.push([preciseLocalTimestamp, dirIndex]);
                    }
                });
            }

            // Sync all high-resolution 5-minute arrays to their respective graph canvas elements simultaneously
            tempChart.updateSeries([{ data: tempTimelinePoints }]);
            pressChart.updateSeries([{ data: pressTimelinePoints }]);
            humidChart.updateSeries([{ data: humidTimelinePoints }]);
            windSpeedChart.updateSeries([
                { data: windGustTimelinePoints },  // Series 0: Peak Wind Gust
                { data: windSpeedTimelinePoints }  // Series 1: Average Wind Speed
            ]);
            windDirChart.updateSeries([{ data: windDirTimelinePoints }]);
            const calculatedYearlyRain = await loadPrecipitationAnalytics();
            updateDashboardUI(currentData, calculatedDailyRain, calculatedYearlyRain);

        } catch (error) {
            console.error("Dashboard analysis pipeline failed:", error);
        }
    }

    runWeatherDashboardPipeline();
    setInterval(runWeatherDashboardPipeline, 4000);
});
