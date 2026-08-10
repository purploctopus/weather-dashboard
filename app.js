const FIREBASE_DB_URL = "https://home-weather-station-d643e-default-rtdb.firebaseio.com/";

// Add the Open-Meteo API endpoint right under your FIREBASE_DB_URL global variable
const METEO_API_URL = "https://api.open-meteo.com/v1/forecast?latitude=43.0731&longitude=-89.4012&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature,precipitation,weather_code,cloud_cover,uv_index,dew_point_2m,precipitation_probability,soil_temperature_0_to_10cm,soil_moisture_0_to_10cm&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=10&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch"
//43.130180900406934, -89.44622950212249 43.13009413665493, -89.44622958866425
const METEO_AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=43.1301&longitude=-89.4462&current=us_aqi"
// === EBIRD REST API INTEGRATION CONSTANTS ===
const EBIRD_API_KEY = "btdlaf52hnv1";
const homeLat = 43.1301;
const homeLng = -89.4462;
//const EBIRD_API_URL = "https://api.ebird.org/v2/data/obs/geo/recent?lat=43.0731&lng=-89.4462&dist=1&back=3&maxResults=10";
//const EBIRD_API_URL = "https://api.ebird.org/v2/data/obs/geo/recent?lat=43.1301&lng=-89.4462&dist=10&back=7&maxResults=25&includeProvisional=true&hotspot=true";
const EBIRD_API_URL = "https://api.ebird.org/v2/data/obs/geo/recent?lat=43.1301&lng=-89.4462&dist=8&back=5&maxResults=100&includeProvisional=true&hotspot=true";

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

// === FEATURE FIXED: Safely updates the humidity explainer text and colors ===
function applyMeteoHumidityRules(val) {
    const rh = Number(val);
    const explainerEl = document.getElementById('humid-comfort-explainer');
    if (!explainerEl || isNaN(rh)) return;

    let comfortText = "";
    let activeColor = "#4ea8de"; // Default blue fallback layout color
    
    if (rh < 30) {
        comfortText = "🌵 Arid: Very dry air. Moisture evaporates rapidly.";
        activeColor = "#ff9f0a"; // Orange warning for aridness
    } else if (rh <= 50) {
        comfortText = "🍃 Ideal: Crisp, comfortable, and perfect garden baseline.";
        activeColor = "#30d158"; // Bright Green
    } else if (rh <= 60) {
        comfortText = "☀️ Moderate: Noticeable moisture, standard summer feel.";
        activeColor = "#64d2ff"; // Light Blue
    } else if (rh <= 70) {
        comfortText = "🌾 Humid: Damp air. Fungal spores and plants thrive.";
        activeColor = "#4ea8de"; // Deeper Blue
    } else if (rh <= 80) {
        comfortText = "🥵 Sticky: Heavy air. Evaporation and cooling slow down.";
        activeColor = "#bf5af2"; // Purple
    } else {
        comfortText = "⛈️ Saturated: Thick air mass. Active dew, fog, or rain.";
        activeColor = "#ff453a"; // Red
    }

    // Update the explainer text block and shift its color directly
    explainerEl.innerText = comfortText;
    explainerEl.style.color = activeColor;
}

// === FEATURE FIXED: Full 13-Level Beaufort Wind Scale Engine ===
function applyMeteoWindRules(val) {
    const speed = Number(val);
    const explainerEl = document.getElementById('wind-speed-explainer');
    if (!explainerEl || isNaN(speed)) return;

    let txt = "";
    let clr = "#4ea8de"; // Default fallback layout color

    if (speed < 1.0) {
        txt = "Calm: Smoke rises vertically. Sea like a mirror.";
        clr = "#30d158"; // Green
    } else if (speed <= 3.0) {
        txt = "Light Air: Direction shown by smoke drift but not wind vanes.";
        clr = "#30d158"; // Green
    } else if (speed <= 7.0) {
        txt = "Light Breeze: Wind felt on face; leaves rustle; wind vane moved.";
        clr = "#64d2ff"; // Light Blue
    } else if (speed <= 12.0) {
        txt = "Gentle Breeze: Leaves and small twigs in constant motion.";
        clr = "#4ea8de"; // Deeper Blue
    } else if (speed <= 18.0) {
        txt = "Moderate Breeze: Raises dust and loose paper; small branches move.";
        clr = "#ffd60a"; // Yellow
    } else if (speed <= 24.0) {
        txt = "Fresh Breeze: Small trees begin to sway; crested wavelets form.";
        clr = "#ff9f0a"; // Orange
    } else if (speed <= 31.0) {
        txt = "Strong Breeze: Large branches in motion; whistling in wires; umbrellas difficult.";
        clr = "#ff453a"; // Red
    } else if (speed <= 38.0) {
        txt = "Near Gale: Whole trees in motion; inconvenience felt walking against wind.";
        clr = "#ff453a"; // Red
    } else if (speed <= 46.0) {
        txt = "Gale: Twigs break off trees, generally impedes progress.";
        clr = "#ff3333"; // Deep Red
    } else if (speed <= 54.0) {
        txt = "Strong Gale: Slight structural damage (chimney pots & slates removed).";
        clr = "#bf5af2"; // Purple
    } else if (speed <= 63.0) {
        txt = "Storm: Seldom experienced inland; trees uprooted; considerable damage.";
        clr = "#bf5af2"; // Purple
    } else if (speed <= 72.0) {
        txt = "Violent Storm: Very rarely experienced; accompanied by widespread damage.";
        clr = "#d90429"; // Crimson
    } else {
        txt = "Hurricane: Devastating damage. Severe environmental emergency.";
        clr = "#9b5de5"; // Dark Magenta
    }
    // Directly update the explainer text block and shift its warning color
    explainerEl.innerText = txt;
    explainerEl.style.color = clr;
}

async function fetchRegionalMeteoData() {
    try {
        // Run both Open-Meteo API network requests in parallel
        const [weatherRes, aqiRes] = await Promise.all([
            fetch(METEO_API_URL),
            fetch(METEO_AQI_URL)
        ]);
        
        const [data, aqiData] = await Promise.all([
            weatherRes.json(),
            aqiRes.json()
        ]);

        if (!data) return;

        // 1. Core Weather & Advanced Analytics Injections
        if (data.current) {
            const cur = data.current;
            const textMappings = {
                'meteo-temp': `${cur.temperature_2m.toFixed(1)} °F`,
                'meteo-humid': `${cur.relative_humidity_2m.toFixed(0)} %`,
                'meteo-wind': `${cur.wind_speed_10m.toFixed(1)} MPH`,
                'meteo-clouds': `${cur.cloud_cover.toFixed(0)} %`,
                'meteo-apparent': `${cur.apparent_temperature.toFixed(1)} °F`,
                'meteo-dew': `${cur.dew_point_2m.toFixed(1)} °F`,
                'meteo-pop': `${cur.precipitation_probability.toFixed(0)} %`,
                'meteo-soil-temp': `${cur.soil_temperature_0_to_10cm.toFixed(1)} °F`
            };

            // Batch inject all standard text strings via a single line loop
            Object.entries(textMappings).forEach(([id, txt]) => {
                const el = document.getElementById(id);
                if (el) el.innerText = txt;
            });

            // === CONSOLIDATED SOIL MOISTURE PERCENTAGE & COLOR ENGINE ===
            const rawValue = cur.soil_moisture_0_to_10cm;
            applySoilMoistureMetrics(rawValue);

            // === GARDENER'S SEED GERMINATION PLANTED TIME RULES ===
            const currentSoilTemp = cur.soil_temperature_0_to_10cm;
            applyGardenerPlantingRules(currentSoilTemp);
            
            // === DEW POINT AIR COMFORT REGULATORY LOGIC ===
            const currentDewPoint = cur.dew_point_2m;
            applyDewPointComfortRules(currentDewPoint);
            
            // === UV INDEX SOLAR EXPOSITION THREAT ENGINE ===
            const currentUV = cur.uv_index;
            applyUVSafetyRules(currentUV);
            
            const currentMeteoHumid = cur.relative_humidity_2m;
            applyMeteoHumidityRules(currentMeteoHumid);
            
            // Inside fetchRegionalMeteoData function right under applyMeteoHumidityRules(currentMeteoHumid);
            const currentMeteoWind = cur.wind_speed_10m;
            applyMeteoWindRules(currentMeteoWind);
        }

        // 2. REAL-TIME US EPA AIR QUALITY METEOROLOGICAL ENGINE
        if (aqiData && aqiData.current && aqiData.current.us_aqi !== undefined) {
            const aqi = Math.round(aqiData.current.us_aqi);
            const aqiValEl = document.getElementById('meteo-aqi');
            const aqiTxtEl = document.getElementById('aqi-text-explainer');
            
            if (aqiValEl && aqiTxtEl) {
                aqiValEl.innerText = aqi;
                
                let label = "Good";
                let clr = "#30d158"; // Green Default
                
                if (aqi <= 50) {
                    label = "Good";
                    clr = "#30d158"; // Green
                } else if (aqi <= 100) {
                    label = "Moderate";
                    clr = "#ffd60a"; // Yellow
                } else if (aqi <= 150) {
                    label = "Sensitive Groups";
                    clr = "#ff9f0a"; // Orange
                } else if (aqi <= 200) {
                    label = "Unhealthy";
                    clr = "#ff453a"; // Red
                } else {
                    label = "Hazardous";
                    clr = "#bf5af2"; // Purple
                }
                
                // Color match both text properties instantly
                aqiValEl.style.color = clr;
                aqiTxtEl.innerText = label;
                aqiTxtEl.style.color = clr;
            }
        }

        // 3. Consolidated 10-Day Forecast Array Builder
        if (data.daily) {
            const daily = data.daily;
            
            // Update browser tab favicon dynamically for day 0
            updateDynamicSiteFavicon(daily.weather_code[0]);
            
            const container = document.getElementById('forecast-container');
            if (!container) return;
            
            const weatherLabels = ["☀️ Clear", "⛅ Partly Cloudy", "🌫️ Foggy", "🌧️ Drizzle/Rain", "❄️ Snowing", "🌦️ Showers", "⚡ Thunderstorm"];
            const getLabel = (c) => weatherLabels[c === 0 ? 0 : c <= 3 ? 1 : c <= 48 ? 2 : c <= 67 ? 3 : c <= 77 ? 4 : c <= 82 ? 5 : 6];

            container.innerHTML = daily.time.slice(0, 10).map((dateStr, i) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                const localDate = new Date(y, m - 1, d);
                
                return `
                    <div class="card" style="min-width: 145px; flex: 1; text-align: center; background: #1c1c1e; border-color: #2a2a2a; padding: 15px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;">
                        <div style="font-size: 0.9rem; font-weight: 600; color: #8e8e93;">${localDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div style="font-size: 0.8rem; color: #555; margin-bottom: 10px;">${localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style="font-size: 1.2rem; margin-bottom: 12px;">${getLabel(daily.weather_code[i])}</div>
                        <div style="font-size: 1.1rem; font-weight: 700; color: #ff453a;">${daily.temperature_2m_max[i].toFixed(0)}°</div>
                        <div style="font-size: 0.9rem; color: #0a84ff; margin-bottom: 8px;">${daily.temperature_2m_min[i].toFixed(0)}°</div>
                        <div style="font-size: 0.75rem; text-transform: uppercase; color: #bf5af2; letter-spacing: 0.05em; margin-top: auto; padding-top: 10px;">🌧️ ${daily.precipitation_probability_max[i]}%</div>
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

            // ===================================================================================
            // 🔋 DYNAMIC BATTERY POWER FUEL GAUGE PROCESSING LAYER (LITHIUM AA PROFILE)
            // ===================================================================================
            // Extract the voltage value securely from your live JSON snapshot object
            const batteryVolts = parseFloat(currentData.battery_voltage || currentData.battery || 6.0);
            
            // Update the text text box value inside your index.html container card
            const voltsTextEl = document.getElementById('dashboard-battery-volts');
            if (voltsTextEl) {
                voltsTextEl.textContent = `${batteryVolts.toFixed(2)}V`;
            }

            // ✅ FIXED FOR LITHIUM AAs: Full pack sits at 6.4V, stable floor sits at 4.6V
            // Lithium drops hard at the finish line, so 4.6V is your strict safety swap margin!
            let batteryPct = Math.round(((batteryVolts - 4.6) / (6.4 - 4.6)) * 100);
            if (batteryPct > 100) batteryPct = 100;
            if (batteryPct < 0)   batteryPct = 0;

            // Dynamically scale the width and background color of your visual battery graphic bar
            const barEl = document.getElementById('dashboard-battery-bar');
            const statusEl = document.getElementById('dashboard-battery-status');
            
            if (barEl && statusEl) {
                barEl.style.width = `${batteryPct}%`;
                statusEl.textContent = `Power: ${batteryPct}%`;

                // Shift accent color modes based on depletion depth layers
                if (batteryPct > 40) {
                    barEl.style.backgroundColor = '#30d158'; // Emerald Green (Healthy Status)
                    statusEl.style.color = '#30d158';
                } else if (batteryPct > 15) {
                    barEl.style.backgroundColor = '#ff9f0a'; // Amber Orange (Low Power Alert)
                    statusEl.style.color = '#ff9f0a';
                } else {
                    barEl.style.backgroundColor = '#ff453a'; // Crimson Red (Critical Warning)
                    statusEl.style.color = '#ff453a';
                }
            }
            // ===================================================================================

            const calculatedYearlyRain = await loadPrecipitationAnalytics();
            
            // This is the line right at the very floor of your pipeline
            updateDashboardUI(currentData, calculatedDailyRain, calculatedYearlyRain);

        } catch (error) {
            console.error("Dashboard analysis pipeline failed:", error);
        }
    }
    
    // Dictionary of common, year-round Madison birds to filter out (The "Grass" Birds)
    const COMMON_MADISON_RESIDENTS = [
        'moudov', // Mourning Dove
        'houspa', // House Sparrow
        'amercrow',// American Crow
        'blujay',  // Blue Jay
        'norcar',  // Northern Cardinal
        'bchchf',  // Black-capped Chickadee
        'daejun',  // Dark-eyed Junco
        'houfin',  // House Finch
        'amgfin',  // American Goldfinch
        'dowwoo',  // Downy Woodpecker
        'haiwoo',  // Hairy Woodpecker
        'wbnuth',  // White-breasted Nuthatch
        'mallar3', // Mallard Duck
        'cangoo'   // Canada Goose
    ];
    
    // Species codes for your absolute favorites that must ALWAYS show up on the dashboard
    const FAVORITE_BIRDS = [
        'easblu', // Eastern Bluebird
        'easmea'  // Eastern Meadowlark
    ];
    
    // Helper function to calculate distance in miles between two coordinates (Haversine Formula) [Ref: 2]
    function calculateDistanceInMiles(lat1, lon1, lat2, lon2) {
        const R = 3958.8; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Initialize a global map variable tracking instance to prevent duplicate allocation drops
    let birdMapInstance = null;
    let birdClusterGroup = null;
    async function fetchLocalBirdSightings() {
        try {
            const response = await fetch(EBIRD_API_URL, {
                headers: { 'X-eBirdApiToken': EBIRD_API_KEY }
            });
            const rawSpeciesList = await response.json();
            if (!rawSpeciesList) return;

            // 1. FIXED: Define your home metrics FIRST so the sorting logic can read them!
            const homeLat = 43.1301;
            const homeLng = -89.4462;

            // 2. Keep your exact filter logic running next
            const speciesList = rawSpeciesList.filter(bird => {
                if (typeof FAVORITE_BIRDS !== 'undefined' && FAVORITE_BIRDS.includes(bird.speciesCode)) {
                    return true;
                }
                if (typeof COMMON_MADISON_RESIDENTS !== 'undefined' && COMMON_MADISON_RESIDENTS.includes(bird.speciesCode)) {
                    return false;
                }
                return true;
            });

            // 3. Run the neighborhood sorting array using the initialized coordinates
            speciesList.sort((birdA, birdB) => {
                const distA = calculateDistanceInMiles(homeLat, homeLng, birdA.lat, birdA.lng);
                const distB = calculateDistanceInMiles(homeLat, homeLng, birdB.lat, birdB.lng);
                return distA - distB;
            });

            // 1. Initialize Leaflet map instance centered over your real location
            if (!birdMapInstance) {
                birdMapInstance = L.map('bird-map', { trackResize: true }).setView([homeLat, homeLng], 14);
                
                // CORRECTED: maxZoom is clamped to 18 to fix the un-rendered gray tiles issue
                L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                    maxZoom: 28
                }).addTo(birdMapInstance);

                // House Anchor Marker Setup
                const homeIcon = L.divIcon({
                    html: `<div style="font-size: 24px; text-shadow: 0 0 4px #000;">🏠</div>`,
                    className: 'custom-home-pin',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                L.marker([homeLat, homeLng], { icon: homeIcon }).addTo(birdMapInstance)
                    .bindPopup(`<strong>Our Weather Station</strong><br>Backyard center anchor.`);
            }

            // 2. Clear out previous data cycle layers safely
            if (typeof birdClusterGroup !== 'undefined' && birdClusterGroup !== null) {
                birdMapInstance.removeLayer(birdClusterGroup);
            }

            // === FIXED: Turn off zooming/wheel styles and setup clean list lookups ===
            birdClusterGroup = L.markerClusterGroup({
                spiderfyOnMaxZoom: false,   // Kills the mechanical wheel layout lines
                zoomToBoundsOnClick: false, // ✅ FIXED: Kills the blind zoom-in actions entirely
                showCoverageOnHover: false
            });

            // =======================================================================================
            // INTERCEPT CLICK EVENT: Drops down a clean scrolling list popup for stacked park bird logs
            // =======================================================================================
            birdClusterGroup.on('clusterclick', function (a) {
                // 1. Gather all child markers packed inside the clicked cluster group
                const childMarkers = a.layer.getAllChildMarkers();
                
                // 2. Set up a crisp high-contrast popup scroll pane structure
                let popupListHtml = `
                    <div style="font-family: sans-serif; color: #1c1c1e; max-height: 220px; overflow-y: auto; min-width: 220px; padding-right: 5px;">
                        <strong style="font-size: 0.95rem; color: #0a84ff; display: block; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                            📋 Cluster Checklist (${childMarkers.length} Species)
                        </strong>
                `;

                // 3. Loop through every single bird inside this specific checklist batch group
                childMarkers.forEach(marker => {
                    // Extract the clean name and count variables we saved inside the options block!
                    const name = marker.options.birdName || "Unknown Bird";
                    const count = marker.options.birdCount || "1";

                    popupListHtml += `
                        <div style="padding: 5px 0; border-bottom: 1px solid #f5f5f7; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
                            <span style="font-weight: 600; color: #1c1c1e;">${name}</span>
                            <!-- ✅ FIXED: Replaced generic 'Sighting' text with the real individual observation count -->
                            <span style="background: #0a84ff; color: #ffffff; padding: 1px 6px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">x${count}</span>
                        </div>
                    `;
                });

                popupListHtml += `</div>`;

                // 4. Open the neat summary list popup directly over the clicked cluster coordinates!
                L.popup()
                    .setLatLng(a.latlng)
                    .setContent(popupListHtml)
                    .openOn(birdMapInstance);
            });
            // =======================================================================================

            let cardsHtml = "";

            speciesList.slice(0, 100).forEach(bird => {
                const obsDate = new Date(bird.obsDt);
                const timeString = obsDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                                   " at " + obsDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                const distance = calculateDistanceInMiles(homeLat, homeLng, bird.lat, bird.lng);
                const isFav = typeof FAVORITE_BIRDS !== 'undefined' && FAVORITE_BIRDS.includes(bird.speciesCode);
                const markerEmoji = isFav ? "⭐" : "🦩";
                const labelText = isFav ? `⭐ ${bird.comName}` : bird.comName;

                // 1. FIXED: Moved popupContent UP so it is completely defined before the marker reads it!
                const popupContent = `
                    <div style="font-family: sans-serif; color: #333; line-height: 1.4; min-width: 160px;">
                        <strong style="font-size: 1rem; color: #d90429;">${isFav ? '⭐ ' : ''}${bird.comName}</strong><br>
                        <span style="font-style: italic; font-size: 0.8rem; color: #666;">${bird.sciName}</span><br>
                        <hr style="border: 0; border-top: 1px solid #ddd; margin: 6px 0;">
                        👥 <strong>Count:</strong> ${bird.howMany || "1"}<br>
                        📍 <strong>Spotter:</strong> ${bird.locName}<br>
                        📏 <strong>Distance:</strong> ${distance.toFixed(2)} miles away<br>
                        📅 <strong>Spotted:</strong> ${timeString}
                    </div>
                `;

                // 2. Clean, single-point pin icon layout
                const birdIcon = L.divIcon({
                    html: `<div style="font-size: 22px; cursor: pointer; text-shadow: 0 0 3px #000;">🦩</div>`,
                    className: 'transient-bird-pin',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Build the standard marker object safely using the compiled templates
                const birdMarker = L.marker([bird.lat, bird.lng], {
                    icon: birdIcon,
                    // === FIX: Save the raw name and count right inside the marker options object ===
                    birdName: bird.comName,
                    birdCount: bird.howMany || "1"
                }).bindPopup(popupContent);

                // 4. Tooltip opens ONLY on hover instead of cluttering the viewport permanently
                birdMarker.bindTooltip(labelText, {
                    permanent: false,
                    direction: 'top',
                    className: 'bird-map-label',
                    sticky: true
                });

                // Push the clean hover pin straight into your spider-leg cluster group
                birdClusterGroup.addLayer(birdMarker);

                // === SAFE VARIABLE CLEANUP: Strips single and double quotes so text strings can never crash the onclick ===
                const cleanComName = bird.comName.replace(/"/g, '\\"').replace(/'/g, "\\'");
                const cleanSciName = bird.sciName.replace(/"/g, '\\"').replace(/'/g, "\\'");
                const cleanLocName = bird.locName.replace(/"/g, '\\"').replace(/'/g, "\\'");

                // B. Compile and Append the Matching Text Card Item String Below the Map Canvas
                cardsHtml += `
                    <div class="bird-data-card" onclick="openBirdDetailModal('${cleanComName}', '${cleanSciName}', '${cleanLocName}', ${distance})" style="background: #1c1c1e; border-color: #2a2a2a; justify-content: flex-start; padding: 15px; border-radius: 12px; text-align: center; width: 100%; box-sizing: border-box; cursor: pointer;">
                        
                        <div style="font-size: 1.1rem; font-weight: 700; color: #ffd60a; margin-bottom: 2px;">${isFav ? '⭐ ' : ''}${bird.comName}</div>
                        <div style="font-size: 0.75rem; font-style: italic; color: #8e8e93; margin-bottom: 10px;">${bird.sciName}</div>
                        <div style="font-size: 1.6rem; font-weight: 800; color: #64d2ff; margin-bottom: 6px;">Seen: ${bird.howMany || "1"}</div>
                        
                        <div style="font-size: 0.7rem; color: #8e8e93; margin-top: auto; border-top: 1px solid #2a2a2a; padding-top: 8px; width: 100%;">
                            📍 ${bird.locName} (${distance.toFixed(2)} mi)<br>
                            📅 ${timeString}
                        </div>
                    </div>
                `;


            });

            // Add the populated cluster instance to the active viewport map canvas
            birdMapInstance.addLayer(birdClusterGroup);

            // Inject the text card matrix elements right into your HTML placeholder
            const listContainer = document.getElementById('bird-cards-list');
            if (listContainer) {
                listContainer.innerHTML = cardsHtml;
            }

        } catch (error) {
            console.error("Failed to query and map eBird database geometries:", error);
        }
    }

    // Fire the tracker immediately when the page loads, and set it to refresh every 15 minutes
    fetchLocalBirdSightings();
    setInterval(fetchLocalBirdSightings, 900000);

    runWeatherDashboardPipeline();
    setInterval(runWeatherDashboardPipeline, 4000);
});
// ====================================================================
// WIKIPEDIA DYNAMIC FIELD GUIDE API MODAL ENGINE
// ====================================================================
async function openBirdDetailModal(comName, sciName, locName, distance) {
    let modal = document.getElementById('bird-info-modal');
    let titleEl = document.getElementById('modal-bird-name');
    let sciEl = document.getElementById('modal-bird-sci');
    let locEl = document.getElementById('modal-bird-loc');
    let distEl = document.getElementById('modal-bird-dist');
    let summaryEl = document.getElementById('modal-bird-summary');
    let imgEl = document.getElementById('modal-bird-photo');
    let loaderEl = document.getElementById('modal-photo-loader');

    if (!modal) return;

    titleEl.textContent = comName;
    sciEl.textContent = sciName;
    locEl.textContent = locName;
    distEl.textContent = parseFloat(distance).toFixed(2);
    
    modal.style.setProperty('display', 'flex', 'important');
    imgEl.style.display = 'none';
    loaderEl.style.display = 'block';
    loaderEl.textContent = "🔍 Fetching Wikipedia Field Guide...";
    summaryEl.textContent = "Loading encyclopedia summary description layers...";

    try {
        let cleanSci = sciName ? sciName.replace(/\\/g, "").trim() : "";
        let cleanCom = comName ? comName.replace(/\\/g, "").trim() : "";

        // 1. Initial Attempt: Query by Scientific Name
        let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanSci)}&prop=pageimages|extracts&exintro&explaintext&exchars=350&piprop=original&format=json&origin=*&redirects=1`;
        console.log("🔬 WIKI SCIENTIFIC SEARCH LINK:", wikiUrl);

        let res = await fetch(wikiUrl);
        let data = await res.json();
        
        let pages = data.query && data.query.pages ? data.query.pages : null;
        let keysArray = pages ? Object.keys(pages) : [];
        let pageId = keysArray.length > 0 ? keysArray[0] : "-1";

        // ✅ FIXED: If the scientific page is missing text extract layers, drop to Common Name immediately!
        if (!pages || pageId === "-1" || !pages[pageId] || !pages[pageId].extract) {
            wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanCom)}&prop=pageimages|extracts&exintro&explaintext&exchars=350&piprop=original&format=json&origin=*&redirects=1`;
            console.log("🦩 WIKI COMMON SEARCH LINK:", wikiUrl);

            res = await fetch(wikiUrl);
            data = await res.json();
            pages = data.query && data.query.pages ? data.query.pages : null;
            keysArray = pages ? Object.keys(pages) : [];
            pageId = keysArray.length > 0 ? keysArray[0] : "-1";
        }

        // 3. Render compiled data assets directly to window frames
        if (pages && pageId !== "-1" && pages[pageId]) {
            let pageData = pages[pageId];

            if (pageData.original && pageData.original.source) {
                imgEl.src = pageData.original.source;
                imgEl.style.display = 'block';
                loaderEl.style.display = 'none';
            } else {
                loaderEl.textContent = "📷 No Public Domain Wiki Photo Available";
            }

            if (pageData.extract) {
                summaryEl.textContent = pageData.extract;
            } else {
                summaryEl.textContent = "No field guide summary text found on Wikipedia.";
            }
        } else {
            loaderEl.textContent = "📷 Field Guide Not Found";
            summaryEl.textContent = "Could not locate a clean matching encyclopedia log on Wikipedia.";
        }
    } catch (err) {
        console.error("Wikipedia REST API query loop failure:", err);
        loaderEl.textContent = "⚠️ Failed to reach network source databases";
        summaryEl.textContent = "An error occurred while attempting to query the live MediaWiki directories.";
    }
}


function closeBirdDetailModal() {
    let modal = document.getElementById('bird-info-modal');
    if (modal) modal.style.setProperty('display', 'none', 'important');
}

//        let wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanSci)}&prop=pageimages|extracts&exintro&explaintext&exchars=350&piprop=original&format=json&origin=*&redirects=1`;
// wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(cleanCom)}&prop=pageimages|extracts&exintro&explaintext&exchars=350&piprop=original&format=json&origin=*&redirects=1`;
