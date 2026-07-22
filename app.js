const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

document.addEventListener("DOMContentLoaded", function() {
    
    // 1. Initialize a Categorical Bar Chart to keep each day completely isolated
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
            type: 'category', // Forces strict discrete columns per day
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
                // Read and sort recorded folder date keys (e.g., ["2026-07-21", "2026-07-22"])
                const sortedDates = Object.keys(fullHistory).sort();

                sortedDates.forEach(dateKey => {
                    if (dateKey.startsWith(currentYearPrefix)) {
                        let daySum = 0.0;
                        
                        // Sum up all 5-minute raw log rows for this specific day
                        Object.values(fullHistory[dateKey]).forEach(row => {
                            const tip = Number(row.rain_last_5_min);
                            if (!isNaN(tip)) daySum += tip;
                        });

                        aggregatedYearTotal += daySum;

                        // Push exactly ONE data value and ONE label string per day to the graph vectors
                        dailyRainTotalsArray.push(Number(daySum.toFixed(3)));
                        
                        // Formats the string to look clean on the axis (e.g., "07-21")
                        const shortDate = dateKey.substring(5);
                        dateLabelsArray.push(shortDate);
                    }
                });
            }

            // Push the single array mappings straight into the chart instance
            rainChart.updateSeries([{ data: dailyRainTotalsArray }]);
            rainChart.updateOptions({ xaxis: { categories: dateLabelsArray } });
            
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
