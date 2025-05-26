import React, {useEffect, useState} from "react";
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

let currentCC = null;

export const Edit = () => {
  const { handleSubmit, register, getValues, formState } = useForm();
  const [locationOptions, setLocationOptions] = useState(null);
  const [canSearch, setCanSearch] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { errors } = formState;

  const updateCanSearch = () => {
    const values = getValues();
    setCanSearch(values.city && values.country);
  };

  const getOptions = () => {
    const values = getValues();

    if (values.city && values.country){
      if (currentCC && (currentCC.city == values.city)&&(currentCC.country == values.country)) {
      } else {
        currentCC = { 
          city: values.city, 
          country: values.country
        }
      
        invoke('getLocationCoordinates', {location: values}).then((val) => { 
          setLocationOptions(val);
          setShowOptions(true);
        });
      }
    }
  };

  const configureGadget = (data) => {
    view.submit({
      ...locationOptions[data.location],
      units: data.units,
    });
  };

  function locationOption(obj, index, array) {
    return { name: "location", label: obj.name + ", " + obj.state + ", " + obj.country, value: index }
  }

  return (
    <>
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label>City<RequiredAsterisk /></Label>
        <Textfield {...register("city", { required: true })} onChange={updateCanSearch} />
        <Label>Country<RequiredAsterisk /></Label>
        <Textfield {...register("country", { required: true })} onChange={updateCanSearch} />
        {canSearch && (
          <Button appearance="secondary" onClick={getOptions}>
            Search
          </Button>
        )}
        {showOptions && (
          <>
            <Label>Select your location<RequiredAsterisk /></Label>
            <RadioGroup {...register("location", {required: true})} options={locationOptions.map(locationOption)}/>
            {errors["location"] && <ErrorMessage>Select a location</ErrorMessage>}
          </>
        )}
        <Label>Units</Label>
        <RadioGroup
          {...register("units", { required: true })}
          options={[
            { name: "units", label: "Metric (°C, m/s)", value: "metric" },
            { name: "units", label: "Imperial (°F, mph)", value: "imperial" },
          ]}
        />
      </FormSection>
      <FormFooter>
        {showOptions && <Button appearance="primary" type="submit">
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
