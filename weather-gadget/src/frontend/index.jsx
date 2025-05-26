import React, {useEffect, useState, useRef, useMemo} from "react";
import ForgeReconciler, {
  Text,
  useProductContext,
  Textfield,
  Form,
  Button,
  FormSection,
  FormFooter,
  Label,
  RequiredAsterisk,
  useForm,
  RadioGroup,
  ErrorMessage,
  Box,
  Inline,
  xcss,
  Heading,
  Strong,
  Image
} from "@forge/react";
import { invoke, view } from "@forge/bridge";

// Moved outside the component as it's a pure utility function
// and renamed for clarity.
const formatLocationAsOption = (location, index) => ({
  label: `${location.name}, ${location.state}, ${location.country}`,
  value: String(index), // Ensure value is a string for RadioGroup compatibility
});

// Helper function to process raw forecast list into daily summaries
const processForecastData = (forecastList, currentUnits) => {
  if (!forecastList || forecastList.length === 0) {
    return [];
  }

  const dailyData = [];
  const seenDates = new Set(); // To ensure we only take one entry per day

  for (const item of forecastList) {
    const date = new Date(item.dt * 1000);
    // Format date e.g., "Mon, Aug 29"
    const dateString = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

    if (!seenDates.has(dateString) && dailyData.length < 5) {
      seenDates.add(dateString);
      dailyData.push({
        date: dateString,
        temp: item.main.temp,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        units: currentUnits, // Pass units for display consistency
      });
    }
    if (dailyData.length >= 5) break; // Stop after 5 unique days
  }
  return dailyData;
};

export const Edit = () => {
  const { handleSubmit, register, getValues, formState } = useForm();
  const [locationOptions, setLocationOptions] = useState(null);
  const [canSearch, setCanSearch] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { errors } = formState;

  // Use useRef to store the last successfully searched query
  const lastSearchedQueryRef = useRef({ city: null, country: null });

  // Get RHF's onChange handlers and other props from register
  const { onChange: rhfCityOnChange, ...cityRegisterProps } = register("city", { required: true });
  const { onChange: rhfCountryOnChange, ...countryRegisterProps } = register("country", { required: true });

  // This function will be called by Textfield's onChange.
  // It ensures RHF's internal state is updated for the specific field
  // before checking all values to update the canSearch state.
  const handleInputChangeAndUpdateCanSearch = (rhfSpecificOnChange, eventOrValue) => {
    rhfSpecificOnChange(eventOrValue); // Call RHF's onChange for the specific field FIRST
    // Now that RHF's state for the changed field is updated, get all values
    const currentValues = getValues();
    setCanSearch(!!(currentValues.city && currentValues.country));
  };

  const getOptions = () => {
    const formValues = getValues(); // Get current form values for city and country

    if (formValues.city && formValues.country) {
      // If the current city and country are the same as the last successful search,
      // and we already have options, just ensure they are shown.
      if (
        lastSearchedQueryRef.current.city === formValues.city &&
        lastSearchedQueryRef.current.country === formValues.country &&
        locationOptions // Check if options are already populated
      ) {
        setShowOptions(true);
        return;
      }

      // New search or inputs changed, proceed to fetch
      invoke('getLocationCoordinates', { location: formValues })
        .then((apiResult) => {
          const newOptions = Array.isArray(apiResult) ? apiResult : [];
          setLocationOptions(newOptions);
          setShowOptions(true);
          // Update the ref to remember this search query on success
          lastSearchedQueryRef.current = { city: formValues.city, country: formValues.country };
        })
        .catch(error => {
          console.error("Error fetching location coordinates:", error);
          setLocationOptions([]); // Clear options on error
          setShowOptions(true); // Still show the section, perhaps with a "no results" message
          // Reset last searched query on error to allow retrying the same query
          lastSearchedQueryRef.current = { city: null, country: null };
        });
    }
  };

  const configureGadget = (data) => {
    // data.location will be a string (e.g., "0", "1"), parse it to an integer
    const locationIndex = parseInt(data.location, 10);

    if (
      locationOptions &&
      !isNaN(locationIndex) && // Check if parsing was successful
      locationOptions[locationIndex] !== undefined
    ) {
      view.submit({
        ...locationOptions[locationIndex],
        units: data.units,
      });
    } else {
      console.error("Cannot submit, location data is invalid or not selected.");
      // Optionally, provide feedback to the user
    }
  };

  const fieldGroupStyle = xcss({ marginBottom: 'space.200' });

  return (
    <>
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label>City<RequiredAsterisk /></Label>
        <Textfield
          label="City" // Accessibility: provide a label prop if Textfield supports it, or ensure Label is correctly associated
          hideLabel={true} // If the visual label is handled by <Label>
          {...cityRegisterProps} // Spread other props from register (name, onBlur, id, etc.)
          onChange={(e) => handleInputChangeAndUpdateCanSearch(rhfCityOnChange, e)}
        />
        <Label>Country<RequiredAsterisk /></Label>
        <Textfield
          label="Country" // Accessibility
          hideLabel={true}
          {...countryRegisterProps} // Spread other props from register
          onChange={(e) => handleInputChangeAndUpdateCanSearch(rhfCountryOnChange, e)}
        />
        {canSearch && (
          <Box xcss={fieldGroupStyle}> {/* Added Box for spacing if needed around button */}
            <Button appearance="secondary" onClick={getOptions}>
              Search
            </Button>
          </Box>
        )}
        {/* Ensure locationOptions is not null before trying to map it */}
        {showOptions && locationOptions && (
          <Box xcss={fieldGroupStyle}>
            <Label>Select your location<RequiredAsterisk /></Label>
            <RadioGroup
              {...register("location", { required: true })}
              options={locationOptions.map(formatLocationAsOption)} // Use the new formatter
            />
            {locationOptions.length === 0 && <Text>No locations found for your search.</Text>}
            {errors["location"] && <ErrorMessage>Select a location</ErrorMessage>}
          </Box>
        )}
        <Box xcss={fieldGroupStyle}>
          <Label>Units<RequiredAsterisk /></Label>
          <RadioGroup
            {...register("units", { required: true })}
            options={[
              // Removed redundant 'name' property from individual options
              { label: "Metric (°C, m/s)", value: "metric" },
              { label: "Imperial (°F, mph)", value: "imperial" },
            ]}
          />
          {errors["units"] && <ErrorMessage>Select units</ErrorMessage>}
        </Box>
      </FormSection>
      <FormFooter>
        {showOptions && locationOptions && locationOptions.length > 0 && <Button appearance="primary" type="submit">
          Submit
        </Button>}
      </FormFooter>
    </Form>
    </>
  );
};

const View = () => {
  const [weatherData, setWeatherData] = useState(null); // Will hold { current: ..., forecast: ..., error: ... }
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [initialConfigName, setInitialConfigName] = useState('');
  const context = useProductContext();

  useEffect(() => {
    setIsLoading(true);
    if (context && context.extension) {
      const config = context.extension.gadgetConfiguration;
      // Check if essential configuration properties exist
      if (config && typeof config.lat !== 'undefined' && typeof config.lon !== 'undefined' && config.units) {
        setIsConfigured(true);
        if (config.name) {
          setInitialConfigName(config.name); // Store city name from config
        }
        invoke('getWeatherData') // Call the new/updated backend function
          .then(data => {
            setWeatherData(data);
            setIsLoading(false);
          })
          .catch(error => {
            console.error("Error invoking getWeatherData:", error);
            setWeatherData({ error: "Failed to load weather data." });
            setIsLoading(false);
          });
      } else {
        setIsConfigured(false);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false); // Context not yet available
    }
  }, [context]); // Rerun effect if context changes

  const containerStyle = xcss({
    padding: 'space.200'
  });

  const promptContainerStyle = xcss({
    padding: 'space.400',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 'space.200', // For spacing between text and button
  });

  const forecastItemStyle = xcss({
    border: '1px solid token("color.border", "#CCCCCC")',
    borderRadius: 'border.radius.100', // Standard border radius
    padding: 'space.100',
    minWidth: '120px',
    textAlign: 'center',
    backgroundColor: 'color.background.input', // Slight background differentiation
    flex: '1 0 120px', // Allow flex shrink and grow from a base of 120px
  });

  const forecastContainerStyle = xcss({
    display: 'flex',
    flexDirection: 'row',
    gap: 'space.100',
    overflowX: 'auto', // Horizontal scroll on smaller screens
    paddingBottom: 'space.100', // For scrollbar visibility
    marginTop: 'space.200',
  });

  // Process forecast data memoized
  const processedDailyForecast = useMemo(() => {
    if (weatherData && weatherData.forecast && weatherData.forecast.list) {
      // Use units from current weather data if available, otherwise from config
      const units = weatherData.current?.units || context?.extension?.gadgetConfiguration?.units;
      return processForecastData(weatherData.forecast.list, units);
    }
    return [];
  }, [weatherData, context]);


  if (isLoading && !context) { // Initial loading before context is ready
    return <Text>Loading context...</Text>; // Handles case where context is not yet available
  }

  if (!isConfigured) {
    return (
      <Box xcss={promptContainerStyle}>
        <Text>Please configure the Weather Gadget to select a location and view weather information.</Text>
      </Box>
    );
  }

  if (isLoading) {
    return <Text>Loading weather data...</Text>;
  }

  if (weatherData && weatherData.error && (!weatherData.current && !weatherData.forecast)) {
    return <Text>Error: {weatherData.error}</Text>;
  }
  
  if (!weatherData || (!weatherData.current && !weatherData.forecast)) {
    return <Text>Weather data is currently unavailable. Please try again later or reconfigure the gadget.</Text>;
  }

  const current = weatherData.current;
  const headingText = current?.name || weatherData.forecast?.city?.name || initialConfigName || 'Weather';
  const displayUnits = current?.units; // Units from current weather data

  return (
    <>
      <Heading as="h2">{headingText} Weather</Heading>
      {current && (
        <Box xcss={containerStyle}>
          <Inline alignBlock="center" space="space.200">
            <Image src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`} alt={current.weather[0].description} />
            <Box>
              <Text>
                <Strong>Current Temperature:</Strong> {current.main.temp.toFixed(1)} {displayUnits === 'imperial' ? '°F' : '°C'}
              </Text>
              <Text>
                <Strong>Feels like:</Strong> {current.main.feels_like.toFixed(1)} {displayUnits === 'imperial' ? '°F' : '°C'}
              </Text>
              <Text><Strong>Humidity:</Strong> {current.main.humidity}%</Text>
              {weatherData.error && !current && <Text xcss={{color: 'color.text.danger'}}>{weatherData.error}</Text>}
            </Box>
          </Inline>
        </Box>
      )}
      {processedDailyForecast.length > 0 && (
        <Box xcss={{ marginTop: 'space.300' }}>
          <Heading as="h3">5-Day Forecast</Heading>
          <Box xcss={forecastContainerStyle}>
            {processedDailyForecast.map((dayFc, index) => (
              <Box key={index} xcss={forecastItemStyle}>
                <Text><Strong>{dayFc.date}</Strong></Text>
                <Image src={`https://openweathermap.org/img/wn/${dayFc.icon}.png`} alt={dayFc.description} />
                <Text>{dayFc.temp.toFixed(1)} {dayFc.units === 'imperial' ? '°F' : '°C'}</Text>
                <Text xcss={{ fontSize: 'font.size.075', color: 'color.text.subtle' }}>{dayFc.description}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {weatherData.error && !weatherData.forecast && processedDailyForecast.length === 0 && <Text xcss={{color: 'color.text.danger', marginTop: 'space.100'}}>{weatherData.error}</Text>}
     </>
  );
};

const App = () => {
  const context = useProductContext();
  if (!context) {
    return "Loading...";
  }

  return context.extension.entryPoint === "edit" ? <Edit /> : <View />;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
