import React, {useEffect, useState, useRef} from "react";
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
  const [weather, setWeather] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [initialConfigName, setInitialConfigName] = useState('');
  const context = useProductContext();

  useEffect(() => {
    if (context && context.extension) {
      const config = context.extension.gadgetConfiguration;
      // Check if essential configuration properties exist
      if (config && typeof config.lat !== 'undefined' && typeof config.lon !== 'undefined' && config.units) {
        setIsConfigured(true);
        if (config.name) {
          setInitialConfigName(config.name); // Store city name from config
        }
        invoke('getCurrentWeather').then(setWeather);
      } else {
        setIsConfigured(false);
      }
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

  if (!context) {
    return <Text>Loading context...</Text>; // Handles case where context is not yet available
  }

  if (!isConfigured) {
    return (
      <Box xcss={promptContainerStyle}>
        <Text>Please configure the Weather Gadget to select a location and view weather information.</Text>
      </Box>
    );
  }

  const headingText = weather ? weather.name : (initialConfigName || 'Loading...');

  return (
    <>
      <Heading as="h2">{headingText} Weather</Heading>
      <Box xcss={containerStyle}>
        <Inline>
          <Image src={weather ? (`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`) : "https://openweathermap.org/img/wn/01d@2x.png"} alt={weather ? weather.weather[0].description : "Loading"} />
          <Box>
            <Text>
              <Strong>Current Temperature</Strong> {weather ? weather.main.temp : '[ ]'} {weather?.units === 'imperial' ? '°F' : '°C'}
            </Text>
            <Text>
              <Strong>Feels like:</Strong> {weather ? weather.main.feels_like : '[ ]'} {weather?.units === 'imperial' ? '°F' : '°C'}
            </Text>
            <Text><Strong>Humidity:</Strong> {weather ? weather.main.humidity : '[ ]'}%</Text>
          </Box>
        </Inline>
      </Box>
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
