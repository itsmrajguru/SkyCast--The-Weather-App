"use strict";

// Replace with your OpenWeatherMap API key
const apiKey = "5ecad7aa4f8eac570de2c62ce0bf298a";

// HTML Elements
const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherDisplay = document.querySelector(".WeatherDisplay");
const errorMsg = document.querySelector(".errorMsg");
const toggleBtn = document.getElementById("toggleTemp");

const tempEl = document.querySelector(".temperature");
const cityEl = document.querySelector(".city");
const descEl = document.querySelector(".description");
const humidityEl = document.querySelector(".humidity");
const windEl = document.querySelector(".wind");
const feelsEl = document.querySelector(".feels");
const iconEl = document.querySelector(".weatherIcon");

const forecastContainer = document.querySelector(".forecast-cards");

// Canvas for animated backgrounds
const canvas = document.getElementById('weatherCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let weatherType = ""; // "Clear", "Rain", "Snow"

let isCelsius = true;
let currentTemp = 0;
let currentFeels = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Particle constructor
class Particle {
    constructor(x, y, vx, vy, size, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.y > canvas.height || this.x > canvas.width || this.x < 0) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Generate particles based on weather
function generateParticles(type) {
    particles = [];
    weatherType = type;
    let count = 0;

    if (type === "Rain") count = 300;
    else if (type === "Snow") count = 200;
    else if (type === "Clear") count = 100;
    else count = 0;

    for (let i = 0; i < count; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let vx = 0;
        let vy = type === "Snow" ? Math.random() * 1 + 0.5 : Math.random() * 4 + 4;
        let size = type === "Snow" ? Math.random() * 3 + 1 : 2;
        let color = type === "Rain" ? "rgba(174,194,224,0.5)" : "rgba(255,255,255,0.8)";
        particles.push(new Particle(x, y, vx, vy, size, color));
    }
}

// Animation loop
function animateParticles() {
    ctx.clearRect(0,0,canvas.width, canvas.height);

    particles.forEach(p => {
        if(weatherType === "Clear") {
            ctx.strokeStyle = "rgba(255, 255, 200, 0.3)";
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + 20);
            ctx.stroke();
            p.y += 2;
            if (p.y > canvas.height) p.y = 0;
        } else {
            p.update();
            p.draw();
        }
    });

    requestAnimationFrame(animateParticles);
}
animateParticles();

// Fetch weather
async function getWeather(city) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`);
        const data = await res.json();

        if(data.cod === "404") {
            errorMsg.textContent = "City not found! Try again.";
            weatherDisplay.style.display = "none";
            forecastContainer.innerHTML = "";
            return;
        }

        errorMsg.textContent = "";
        weatherDisplay.style.display = "block";

        currentTemp = data.main.temp;
        currentFeels = data.main.feels_like;
        updateTemperature();

        cityEl.textContent = data.name;
        descEl.textContent = data.weather[0].description;
        humidityEl.textContent = data.main.humidity + "%";
        windEl.textContent = data.wind.speed + " km/h";

        const iconCode = data.weather[0].icon;
        iconEl.src = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

        // Background gradients
        const weather = data.weather[0].main;
        const bgColors = {
            Clear: "linear-gradient(145deg, #fddb92, #f5aa42)",
            Clouds: "linear-gradient(145deg, #757f9a, #d7dde8)",
            Rain: "linear-gradient(145deg, #1f3a93, #3a7bd5)",
            Drizzle: "linear-gradient(145deg, #4aa0d5, #7fdbff)",
            Snow: "linear-gradient(145deg, #83a4d4, #b6fbff)",
            Mist: "linear-gradient(145deg, #3e5151, #decba4)",
            Haze: "linear-gradient(145deg, #6e7f80, #c0c0c0)"
        };
        document.body.style.background = bgColors[weather] || "#222";

        // Generate particle animation
        if(weather === "Rain" || weather === "Drizzle") generateParticles("Rain");
        else if(weather === "Snow") generateParticles("Snow");
        else if(weather === "Clear") generateParticles("Clear");
        else particles = [];

        getForecast(city);

    } catch(err) {
        console.error(err);
        errorMsg.textContent = "Something went wrong! Try again.";
        weatherDisplay.style.display = "none";
        forecastContainer.innerHTML = "";
    }
}

// Toggle Celsius / Fahrenheit
function updateTemperature() {
    if(isCelsius) {
        tempEl.textContent = Math.round(currentTemp) + "°C";
        feelsEl.textContent = Math.round(currentFeels) + "°C";
        toggleBtn.textContent = "Show °F";
    } else {
        tempEl.textContent = Math.round(currentTemp * 9/5 + 32) + "°F";
        feelsEl.textContent = Math.round(currentFeels * 9/5 + 32) + "°F";
        toggleBtn.textContent = "Show °C";
    }
}

toggleBtn.addEventListener("click", () => {
    isCelsius = !isCelsius;
    updateTemperature();
    getForecast(cityInput.value); // update forecast temps
});

// Fetch 5-day forecast
async function getForecast(city) {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`);
    const data = await res.json();

    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

    forecastContainer.innerHTML = "";
    daily.slice(0,5).forEach(day => {
        const card = document.createElement("div");
        card.classList.add("forecast-card");

        const icon = document.createElement("img");
        icon.src = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
        const date = new Date(day.dt_txt);
        const dayName = date.toLocaleDateString(undefined, { weekday: 'short' });

        let temp = isCelsius ? Math.round(day.main.temp) + "°C" : Math.round(day.main.temp * 9/5 + 32) + "°F";

        card.innerHTML = `<p>${dayName}</p>`;
        card.appendChild(icon);
        card.innerHTML += `<p>${temp}</p>`;

        forecastContainer.appendChild(card);
    });
}

// Event listeners
searchBtn.addEventListener("click", () => getWeather(cityInput.value));
cityInput.addEventListener("keypress", (e) => {
    if(e.key === "Enter") getWeather(cityInput.value);
});

const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
    weatherDisplay.style.display = "none";  // hide main weather
    forecastContainer.innerHTML = "";       // clear forecast cards
    cityInput.value = "";                   // clear input
    errorMsg.textContent = "";              // clear error message
    particles = [];                          // stop current particle animation
});

document.getElementById("backArrow").addEventListener("click", () => {
    weatherDisplay.style.display = "none";
    forecastContainer.innerHTML = "";
    cityInput.value = "";
    errorMsg.textContent = "";
    particles = [];
});
