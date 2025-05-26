import Resolver from '@forge/resolver';
import { fetch } from '@forge/api'

const resolver = new Resolver();

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHER_KEY;

resolver.define('getText', (req) => {
  console.log(req);

  return 'Hello, world!';
});

resolver.define('getLocationCoordinates', async (req) => {

  if (req.payload.location) {
    const config = req.payload.location;
    const url = "https://api.openweathermap.org/geo/1.0/direct?q=" + config.city + "," + config.country + "&limit=5&appid=" + OPENWEATHERMAP_API_KEY;
    const response = await fetch(url)
    if (!response.ok) {
      const errmsg = `Error from Open Weather Map Geolocation API: ${response.status} ${await response.text()}`;
      console.error(errmsg)
      throw new Error(errmsg)
    }
    const locations = await response.json()
    return locations;
  } else {
    return null;
  }
});

resolver.define('getWeatherData', async (req) => {
  const config = req.context.extension.gadgetConfiguration;
  if (!config || typeof config.lat === 'undefined' || typeof config.lon === 'undefined' || !config.units) {
    console.error('Weather gadget not configured with lat, lon, or units.');
    return { current: null, forecast: null, error: "Gadget not configured." };
  }
  const { lat, lon, units } = config;

  if (!OPENWEATHERMAP_API_KEY) {
    console.error('OPENWEATHERMAP_API_KEY is not set.');
    return { current: null, forecast: null, error: "Weather service API key not configured." };
  }

  try {
    const currentWeatherPromise = fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=${units}`);
    const forecastPromise = fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHERMAP_API_KEY}&units=${units}`);

    const [currentWeatherResponse, forecastResponse] = await Promise.all([currentWeatherPromise, forecastPromise]);

    const currentWeatherData = await currentWeatherResponse.json();
    const forecastApiData = await forecastResponse.json();
    
    let errorMessages = [];
    if (!currentWeatherResponse.ok) {
        const errorMsg = `Failed to fetch current weather: ${currentWeatherData.message || currentWeatherResponse.statusText}`;
        console.error(errorMsg);
        errorMessages.push(errorMsg);
    }
    if (!forecastResponse.ok) {
        const errorMsg = `Failed to fetch forecast: ${forecastApiData.message || forecastResponse.statusText}`;
        console.error(errorMsg);
        errorMessages.push(errorMsg);
    }

    if (errorMessages.length > 0) {
        return { current: !currentWeatherResponse.ok ? null : { ...currentWeatherData, units }, forecast: !forecastResponse.ok ? null : forecastApiData, error: errorMessages.join(' ') };
    }

    return {
      current: { ...currentWeatherData, units }, // Pass units along
      forecast: forecastApiData,
    };
  } catch (error) {
    console.error('Error in getWeatherData resolver:', error);
    return { current: null, forecast: null, error: "An unexpected error occurred." };
  }
});

export const handler = resolver.getDefinitions();