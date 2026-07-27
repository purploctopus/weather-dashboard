const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Add the Open-Meteo API endpoint right under your FIREBASE_DB_URL global variable
const METEO_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=43.0731&longitude=-89.4012&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,precipitation,weather_code,cloud_cover,uv_index,dew_point_2m,precipitation_probability,soil_temperature_0_to_10cm,soil_moisture_0_to_10cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch"
//43.130180900406934, -89.44622950212249

// === REPLACE YOUR OLD getSoilMoistureColor FUNCTION COMPLETELY WITH THIS ===
function applySoilMoistureMetrics(rawM3) {
    const num = Number(rawM3);
    const card = document.getElementById('meteo-soil-moist');
    if (!card || isNaN(num)) return;

    // 1. Calculate relative percentage: (Raw - WiltingPoint) / (FieldCapacity - WiltingPoint) * 100
    let percentage = ((num - 0.05) / (0.35 - 0.05)) * 100;
    
    // Clamp the values cleanly so it never shows negative numbers in severe droughts
    if (percentage < 0) percentage = 0;
    
    // Update the card text string to show the clean % right next to the raw reference index
    card.innerText = `${percentage.toFixed(0)}%`;

    // 2. Reset and toggle your micro-legend active indicator states
    const items = ['leg-vrydry', 'leg-dry', 'leg-mod', 'leg-mst', 'leg-wet', 'leg-sat'];
    items.forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.opacity = '0.3'; el.style.fontWeight = 'normal'; }
    });

    let activeId = '';
    let activeColor = '#ffffff';

    // Evaluate thresholds using your exact chart guidelines
    if (num <= 0.05) { activeId = 'leg-vrydry'; activeColor = '#ff453a'; }      // Very Dry (0%)
    else if (num <= 0.10) { activeId = 'leg-dry'; activeColor = '#ff9f0a'; }   // Dry (1% - 16%)
    else if (num <= 0.20) { activeId = 'leg-mod'; activeColor = '#ffd60a'; }   // Mod (17% - 50%)
    else if (num <= 0.30) { activeId = 'leg-mst'; activeColor = '#30d158'; }   // Ideal / Moist (51% - 83%)
    else if (num <= 0.40) { activeId = 'leg-wet'; activeColor = '#64d2ff'; }   // Wet (84% - 116%)
    else { activeId = 'leg-sat'; activeColor = '#bf5af2'; }                  // Saturated (>116%)

    // Inject the warning color straight onto your elements simultaneously
    card.style.color = activeColor;
    const activeLabel = document.getElementById(activeId);
    if (activeLabel) {
        activeLabel.style.opacity = '1';
        activeLabel.style.fontWeight = 'bold';
    }
}

// === Encodes the SVG layout string to prevent the icon from reverting ===
function updateDynamicSiteFavicon(wmoCode) {
    const faviconEl = document.getElementById('site-favicon');
    if (!faviconEl) return;

    let weatherEmoji = "☀️"; // Default Clear
    if (wmoCode <= 3)  weatherEmoji = "⛅"; // Partly Cloudy
    else if (wmoCode <= 48) weatherEmoji = "🌁"; // Foggy
    else if (wmoCode <= 67) weatherEmoji = "🌧️"; // Drizzle/Rain
    else if (wmoCode <= 77) weatherEmoji = "❄️"; // Snowing
    else if (wmoCode <= 82) weatherEmoji = "🌦️"; // Showers
    else if (wmoCode >= 95) weatherEmoji = "⚡"; // Thunderstorm

    // Clean raw string markup structure
    const rawSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='0.9em' font-size='90'>${weatherEmoji}</text></svg>`;

    // FIX: Encodes spaces and quotes safely so the browser doesn't drop the asset link
    faviconEl.href = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(rawSvg);
}

// === Dynamic Soil Temperature Planting Guide Engine ===
function applyGardenerPlantingRules(val) {
    const temp = Number(val);
    const guideEl = document.getElementById('soil-planting-guide');
    if (!guideEl || isNaN(temp)) return;

    let guideText = "";
    
    if (temp < 45) {
        guideText = "❄️ Soil Dormant: Too cold for seed activity.";
    } else if (temp < 50) {
        guideText = "🌱 Early Sowing: Plant Spinach, Peas, Radishes & Kale.";
    } else if (temp < 60) {
        guideText = "🥕 Cool Season: Plant Carrots, Beets, Onions & Lettuce.";
    } else if (temp < 70) {
        guideText = "🍅 Warm Season: Safe for Tomatoes, Corn, Beans & Cucumbers.";
    } else if (temp < 85) {
        guideText = "🌶️ Summer Peak: Ideal for Peppers, Eggplants, Melons & Squash.";
    } else {
        guideText = "🔥 High Heat: Protect roots. Add mulch to hold water.";
    }

    guideEl.innerText = guideText;
}

// === NEW FEATURE: Dew Point Air Comfort Index Explainer ===
function applyDewPointComfortRules(val) {
    const dew = Number(val);
    const explainerEl = document.getElementById('dew-comfort-explainer');
    if (!explainerEl || isNaN(dew)) return;

    let comfortText = "";
    
    if (dew < 50) {
        comfortText = "🍃 Crisp & Dry: Refreshing air quality. Great for yard work!";
    } else if (dew < 55) {
        comfortText = "☀️ Comfortable: Clean, pleasant baseline environment.";
    } else if (dew < 60) {
        comfortText = "🌾 Noticeable: Becoming slightly sticky. Standard summer feel.";
    } else if (dew < 65) {
        comfortText = "🥵 Muggy: Sticky and humid air. Plants love it, humans don't.";
    } else if (dew < 70) {
        comfortText = "🔥 Oppressive: Very thick and soupy. Take breaks in the shade.";
    } else {
        comfortText = "🤢 Miserable: Extreme tropical air mass. Air feels completely heavy.";
    }

    explainerEl.innerText = comfortText;
}

// === FEATURE FIXED: Completely mirrors the soil moisture color-coding logic ===
function applyUVSafetyRules(val) {
    const uv = Number(val);
    const cardVal = document.getElementById('meteo-uv');
    const explainerEl = document.getElementById('uv-safety-explainer');
    
    if (!cardVal || !explainerEl || isNaN(uv)) return;

    // 1. Force the big number value text to render right here
    cardVal.innerText = uv.toFixed(1);

    let safetyText = "";
    let activeColor = "#ffffff"; // Fallback white
    
    if (uv < 3.0) {
        safetyText = "🟢 Low: Minimal skin hazard. Safe baseline sun levels.";
        activeColor = "#30d158"; // Bright Green
    } else if (uv < 6.0) {
        safetyText = "🟡 Moderate: Burn risk in 30-45 mins. Apply SPF 15+ if outdoors.";
        activeColor = "#ffd60a"; // Yellow
    } else if (uv < 8.0) {
        safetyText = "🟠 High: Burns can happen in 15-20 mins. Wear a hat & SPF 30+.";
        activeColor = "#ff9f0a"; // Orange
    } else if (uv < 11.0) {
        safetyText = "🔴 Very High: Intense sun. Skin burns in 10 mins. Seek shade.";
        activeColor = "#ff453a"; // Bright Red
    } else {
        safetyText = "🟣 Extreme: Dangerous radiation. Avoid direct midday sun entirely.";
        activeColor = "#bf5af2"; // Purple
    }

    // 2. Color code BOTH properties together exactly like your soil moisture card
    cardVal.style.color = activeColor;       // Forces the big number 7.0 to turn orange
    explainerEl.innerText = safetyText;
    explainerEl.style.color = activeColor;   // Forces the explainer text below it to turn orange
}

async function fetchRegionalMeteoData() {
    try {
        const response = await fetch(METEO_API_URL);
        const data = await response.json();
        if (!data) return;

        // 1. Consolidated Current, Advanced, & Missing Core Injections
        if (data.current) {
            const cur = data.current;
            const textMappings = {
                // FIXED: Restored the four original missing forecast card targets
                'meteo-temp': `${cur.temperature_2m.toFixed(1)} °F`,
                'meteo-humid': `${cur.relative_humidity_2m.toFixed(0)} %`,
                'meteo-wind': `${cur.wind_speed_10m.toFixed(1)} MPH`,
                'meteo-clouds': `${cur.cloud_cover.toFixed(0)} %`,
                
                // Advanced soil and environment metrics
                'meteo-apparent': `${cur.apparent_temperature.toFixed(1)} °F`,
                'meteo-uv': cur.uv_index.toFixed(1),
                'meteo-dew': `${cur.dew_point_2m.toFixed(1)} °F`,
                'meteo-pop': `${cur.precipitation_probability.toFixed(0)} %`,
                'meteo-soil-temp': `${cur.soil_temperature_0_to_10cm.toFixed(1)} °F`,
                'meteo-soil-moist': `${cur.soil_moisture_0_to_10cm.toFixed(3)} m³/m³`
            };
            // 1. Batch inject all standard text strings via a single line key loop
            Object.entries(textMappings).forEach(([id, txt]) => {
                const el = document.getElementById(id);
                if (el) el.innerText = txt;
            });

            // === NEW: CONSOLIDATED SOIL MOISTURE PERCENTAGE & COLOR ENGINE ===
            const rawValue = cur.soil_moisture_0_to_10cm;
            applySoilMoistureMetrics(rawValue);

            // ===============================================
            const currentSoilTemp = cur.soil_temperature_0_to_10cm;
            
            // Execute the evaluation logic to swap out your planting text tips on the fly
            applyGardenerPlantingRules(currentSoilTemp);
            
            const currentDewPoint = cur.dew_point_2m;
            
            // Execute the evaluation logic to swap out your humidity comfort tips
            applyDewPointComfortRules(currentDewPoint);
            
            const currentUV = cur.uv_index;
            
            // Execute the evaluation logic to swap out your sun safety tips dynamically
            applyUVSafetyRules(currentUV);
        }

        // 2. Consolidated 10-Day Forecast Array Builder
        if (data.daily) {
            const daily = data.daily;
            
            updateDynamicSiteFavicon(daily.weather_code[0]);
            
            const container = document.getElementById('forecast-container');
            if (!container) return;
            
            const weatherLabels = ["☀️ Clear", "⛅ Partly Cloudy", "🌫️ Foggy", "🌧️ Drizzle/Rain", "❄️ Snowing", "🌦️ Showers", "⚡ Thunderstorm"];
            const getLabel = (c) => weatherLabels[c === 0 ? 0 : c <= 3 ? 1 : c <= 48 ? 2 : c <= 67 ? 3 : c <= 77 ? 4 : c <= 82 ? 5 : 6];

            container.innerHTML = daily.time.slice(0, 10).map((dateStr, i) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                const localDate = new Date(y, m - 1, d);
                
                return `
                    <div class="card" style="min-width: 145px; flex: 1; text-align: center; background: #1c1c1e; border-color: #2a2a2a; padding: 15px; border-radius: 12px;">
                        <div style="font-size: 0.9rem; font-weight: 600; color: #8e8e93;">${localDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div style="font-size: 0.8rem; color: #555; margin-bottom: 10px;">${localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style="font-size: 1.2rem; margin-bottom: 12px;">${getLabel(daily.weather_code[i])}</div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #ff453a;">${daily.temperature_2m_max[i].toFixed(0)}°</div>
                        <div style="font-size: 0.9rem; color: #0a84ff; margin-bottom: 8px;">${daily.temperature_2m_min[i].toFixed(0)}°</div>
                        <div style="font-size: 0.75rem; text-transform: uppercase; color: #bf5af2; letter-spacing: 0.05em; margin-top: 10px;">🌧️ ${daily.precipitation_probability_max[i]}%</div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error("Open-Meteo macro lookup failed to pull:", error);
    }
}


// Fire the Open-Meteo API immediately on boot, and set it to loop every 5 minutes (300,000 ms).
// (Note: Do not poll Open-Meteo every 4 seconds or they will temporarily block your IP address!)
fetchRegionalMeteoData();
setInterval(fetchRegionalMeteoData, 300000);

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
        stroke: { curve: 'smooth', width: [4, 2], connectNulls: false },
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
        colors: ['#ff5050', '#ff9999'],
        series: [
            { name: 'Peak Wind Gust', data: [] },
            { name: 'Average Wind Speed', data: [] }
        ],
        xaxis: { type: 'datetime', labels: { datetimeUTC: false, format: 'hh:mm TT' }, axisBorder: { show: true, color: '#333' } },
        stroke: { curve: 'smooth', width: [4, 2], connectNulls: false },
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
