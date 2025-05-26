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

export const handler = resolver.getDefinitions();