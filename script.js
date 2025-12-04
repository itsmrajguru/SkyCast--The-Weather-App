//
// 🚀 script.js - The Brains of the Operation - Now with View Transitions and Converters!
// Managing API calls, smooth view switching, and widget functionality.
//

// --- API Secret Sauce (Shhh!) ---
const API_KEY = '5ecad7aa4f8eac570de2c62ce0bf298a'; // Seriously, replace this placeholder!
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// --- DOM References (Aka "My HTML Friends") ---
const cityInput = document.getElementById('city-input');
const searchButton = document.getElementById('search-btn'); 
const oopsMessage = document.getElementById('error-message'); 

// View Controllers
const homeView = document.getElementById('home-view');
const resultsView = document.getElementById('results-view');
const backButton = document.getElementById('back-btn');

// Conversion Widget Elements
const celsiusInput = document.getElementById('celsius-input');
const fahrenheitInput = document.getElementById('fahrenheit-input');
const conversionResult = document.getElementById('conversion-result');

// --- View Transition Function ---
function switchView(targetView) {
    if (targetView === 'results') {
        homeView.classList.remove('active-view');
        resultsView.classList.add('active-view');
    } else { // targetView === 'home'
        resultsView.classList.remove('active-view');
        homeView.classList.add('active-view');
        oopsMessage.classList.add('hidden'); // Clear error on back
    }
}

// --- Event Listeners: Let's make things clickable! ---
searchButton.addEventListener('click', () => {
    const cityName = cityInput.value.trim();
    if (cityName) {
        getTheWeather(cityName);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

backButton.addEventListener('click', () => {
    switchView('home');
});

// Default behavior on load: show home view
document.addEventListener('DOMContentLoaded', () => {
    homeView.classList.add('active-view');
});

// --- TEMP CONVERSION LOGIC ---
celsiusInput.addEventListener('input', () => {
    const celsius = parseFloat(celsiusInput.value);
    if (!isNaN(celsius)) {
        const fahrenheit = (celsius * 9/5) + 32;
        fahrenheitInput.value = fahrenheit.toFixed(2);
        conversionResult.textContent = `${celsius}°C is ${fahrenheit.toFixed(2)}°F`;
    } else {
        fahrenheitInput.value = '';
        conversionResult.textContent = 'Enter a value to convert.';
    }
});

fahrenheitInput.addEventListener('input', () => {
    const fahrenheit = parseFloat(fahrenheitInput.value);
    if (!isNaN(fahrenheit)) {
        const celsius = (fahrenheit - 32) * 5/9;
        celsiusInput.value = celsius.toFixed(2);
        conversionResult.textContent = `${fahrenheit}°F is ${celsius.toFixed(2)}°C`;
    } else {
        celsiusInput.value = '';
        conversionResult.textContent = 'Enter a value to convert.';
    }
});


// --- The Core Fetching Function ---
async function getTheWeather(city) {
    const currentEndpoint = `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const forecastEndpoint = `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    
    // Show a loading indicator briefly (optional, but good practice)
    oopsMessage.textContent = `Searching for ${city}...`;
    oopsMessage.classList.remove('hidden');

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(currentEndpoint),
            fetch(forecastEndpoint)
        ]);
        
        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error('City not found.');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();
        
        updateCurrentUI(currentData);
        buildForecastCards(forecastData);
        
        // Success! Switch to the results view.
        switchView('results');
        oopsMessage.classList.add('hidden');
        
    } catch (error) {
        console.error('Data Fetching Failed:', error);
        oopsMessage.textContent = 'Whoops! Couldn\'t find that city or the API is giving us trouble.';
        oopsMessage.classList.remove('hidden');
    }
}

// --- The UI Update Functions (Unchanged, just using document.getElementById directly) ---

function updateCurrentUI(data) {
    const { name, sys, main, wind, weather } = data;

    document.getElementById('location-name').textContent = `${name}, ${sys.country}`;
    document.getElementById('weather-condition-text').textContent = weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1);
    document.getElementById('current-temp').textContent = `${Math.round(main.temp)}°C`;
    
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('wind-speed').textContent = `${(wind.speed * 3.6).toFixed(1)} km/h`; 
    document.getElementById('feels-like').textContent = `${Math.round(main.feels_like)}°C`;
    
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.className = 'fas'; 
    weatherIcon.classList.add(getIconClass(weather[0].id));
}

function buildForecastCards(data) {
    const dailyForecasts = data.list.filter(item => item.dt_txt.includes('12:00:00'));
    const forecastCards = document.getElementById('forecast-list');
    forecastCards.innerHTML = ''; 

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    dailyForecasts.slice(0, 5).forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = daysOfWeek[date.getDay()];
        const temp = Math.round(item.main.temp);
        const iconClass = getIconClass(item.weather[0].id);

        const cardHTML = `
            <div class="forecast-item glass-card">
                <p class="day">${dayName}</p>
                <i class="fas ${iconClass}"></i>
                <p class="temp">${temp}°C</p>
            </div>
        `;
        forecastCards.innerHTML += cardHTML;
    });
}

function getIconClass(weatherId) {
    if (weatherId >= 200 && weatherId < 300) return 'fa-bolt'; 
    if (weatherId >= 300 && weatherId < 400) return 'fa-cloud-rain'; 
    if (weatherId >= 500 && weatherId < 600) return 'fa-cloud-showers-heavy'; 
    if (weatherId >= 600 && weatherId < 700) return 'fa-snowflake'; 
    if (weatherId >= 700 && weatherId < 800) return 'fa-smog'; 
    if (weatherId === 800) return 'fa-sun'; 
    if (weatherId > 800) return 'fa-cloud'; 

    return 'fa-question-circle'; 
}