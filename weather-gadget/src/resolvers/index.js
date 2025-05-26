import Resolver from '@forge/resolver';
import { fetch } from '@forge/api'

const resolver = new Resolver();


resolver.define('getText', (req) => {
  console.log(req);

  return 'Hello, world!';
});

resolver.define('getLocationCoordinates', async (req) => {

  if (req.payload.location) {
    const config = req.payload.location;
    const url = "https://api.openweathermap.org/geo/1.0/direct?q=" + config.city + "," + config.country + "&limit=5&appid=" + process.env.OPENWEATHER_KEY;
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

resolver.define('getCurrentWeather', async (req) => {

  if (req.context.extension.gadgetConfiguration) {
    const { lat, lon, units } = req.context.extension.gadgetConfiguration; // Destructure to get lat, lon, and units
    // Default to metric if units is not provided, though it should be set by the config
    const unitsParam = units || 'metric'; 
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unitsParam}&appid=${process.env.OPENWEATHER_KEY}`;
    const response = await fetch(url)
    if (!response.ok) {
      const errmsg = `Error from Open Weather Map Current Weather API: ${response.status} ${await response.text()}`;
      console.error(errmsg)
      throw new Error(errmsg)
    }
    const weather = await response.json()
    return weather;
  } else {
    return null;
  }  
});

export const handler = resolver.getDefinitions();