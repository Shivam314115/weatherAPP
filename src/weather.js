// weather.js
const apiKey = '2a9f1e7635f54b3bbd6121610252707';
const searchInput = document.querySelector('input[type="text"]');
const searchButton = document.querySelector('button');

const tempSpan = document.querySelector('.current-temp');
const highSpan = document.querySelector('.high-temp');
const lowSpan = document.querySelector('.low-temp');
const conditionSpan = document.querySelector('.condition');
const feelsLikeSpan = document.querySelector('.feels-like');
const humiditySpan = document.querySelector('.humidity');
const windSpan = document.querySelector('.wind');
const forecastRow = document.querySelector('.forecast-row');
const locationSpan = document.querySelector('.location');

function setWeatherBackground(condition) {
  let bgUrl = 'wallhaven.jpg';
  if (/rain|drizzle|thunder/i.test(condition)) {
    bgUrl = 'rainy.jpg';
  } else if (/cloud/i.test(condition)) {
    bgUrl = 'cloudy.jpg';
  } else if (/clear|sun/i.test(condition)) {
    bgUrl = 'sunny.jpg';
  } else if (/snow/i.test(condition)) {
    bgUrl = 'snowy.jpg';
  }
  // Create or update a background div
  let bgDiv = document.getElementById('weather-bg');
  if (!bgDiv) {
    bgDiv = document.createElement('div');
    bgDiv.id = 'weather-bg';
    bgDiv.style.position = 'fixed';
    bgDiv.style.top = '0';
    bgDiv.style.left = '0';
    bgDiv.style.width = '100vw';
    bgDiv.style.height = '100vh';
    bgDiv.style.zIndex = '-1';
    bgDiv.style.pointerEvents = 'none';
    document.body.prepend(bgDiv);
  }
  bgDiv.style.backgroundImage = `url('${bgUrl}')`;
  bgDiv.style.backgroundSize = 'cover';
  bgDiv.style.backgroundPosition = 'center';
  bgDiv.style.backgroundRepeat = 'no-repeat';
  bgDiv.style.filter = 'blur(4px)';
}

function updateWeather(data) {
  tempSpan.textContent = `${Math.round(data.current.temp_c)}°C`;
  highSpan.textContent = `High ${Math.round(data.forecast.forecastday[0].day.maxtemp_c)}°C`;
  lowSpan.textContent = `Low ${Math.round(data.forecast.forecastday[0].day.mintemp_c)}°C`;
  conditionSpan.textContent = data.current.condition.text;
  feelsLikeSpan.textContent = `Feels Like ${Math.round(data.current.feelslike_c)}°C`;
  humiditySpan.textContent = `Humidity ${data.current.humidity}%`;
  windSpan.textContent = `Wind ${Math.round(data.current.wind_kph)} kph`;
  if (locationSpan) {
    locationSpan.textContent = `${data.location.name}, ${data.location.country}`;
  }

  // Update weekly forecast
  if (forecastRow) {
    forecastRow.innerHTML = '';
    data.forecast.forecastday.forEach((day, idx) => {
      const date = new Date(day.date);
      const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
      forecastRow.innerHTML += `
        <div class="flex flex-col items-center mr-4">
          <span class="text-white text-xl sm:text-2xl">${weekday.toUpperCase()}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 008 0m0 0a4 4 0 008 0m-8 0V3" /></svg>
          <span class="text-white text-lg sm:text-xl">${Math.round(day.day.maxtemp_c)}° ${Math.round(day.day.mintemp_c)}°</span>
        </div>
      `;
    });
  }

  setWeatherBackground(data.current.condition.text);
}

async function fetchWeather(city) {
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=7&aqi=no&alerts=no`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('City not found');
    const data = await response.json();
    updateWeather(data);
  } catch (err) {
    alert('Could not fetch weather. Please check the city name.');
  }
}

function getLocalCityAndFetchWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Location not found');
        const data = await response.json();
        updateWeather(data);
        searchInput.value = data.location.name;
      } catch (err) {
        // fallback: show default city
        fetchWeather('London');
      }
    }, () => {
      // fallback: show default city
      fetchWeather('London');
    });
  } else {
    // fallback: show default city
    fetchWeather('London');
  }
}

document.addEventListener('DOMContentLoaded', getLocalCityAndFetchWeather);

searchButton.addEventListener('click', () => {
  const city = searchInput.value.trim();
  if (city) fetchWeather(city);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = searchInput.value.trim();
    if (city) fetchWeather(city);
  }
});

let homeLocation = null;
let currentUnits = 'metric'; // 'metric' or 'imperial'

function fetchWeatherWithUnits(cityOrCoords) {
  let query = typeof cityOrCoords === 'string' ? cityOrCoords : `${cityOrCoords.lat},${cityOrCoords.lon}`;
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(query)}&days=7&aqi=no&alerts=no`;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      updateWeather(data);
      searchInput.value = data.location.name;
    })
    .catch(() => alert('Could not fetch weather.'));
}

const buttons = document.querySelectorAll('.button-animate');

if (buttons.length === 5) {
  // 1st button: Get current location weather
  buttons[0].addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchWeatherWithUnits({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      }, () => fetchWeatherWithUnits('London'));
    } else {
      fetchWeatherWithUnits('London');
    }
  });

  // 2nd button: Get home location weather
  buttons[1].addEventListener('click', () => {
    if (homeLocation) {
      fetchWeatherWithUnits(homeLocation);
    } else {
      alert('No home location saved.');
    }
  });

  // 3rd button: Save current location as home
  buttons[2].addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        homeLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        alert('Home location saved!');
      }, () => alert('Could not get location.'));
    } else {
      alert('Geolocation not supported.');
    }
  });

  // 4th button: Toggle units
  buttons[3].addEventListener('click', () => {
    currentUnits = currentUnits === 'metric' ? 'imperial' : 'metric';
    const city = searchInput.value.trim();
    if (city) {
      fetchWeatherWithUnits(city);
    }
  });

  // 5th button: Refresh current weather
  buttons[4].addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
      fetchWeatherWithUnits(city);
    }
  });
} else {
  console.error('Expected 5 buttons, but found:', buttons.length);
}
