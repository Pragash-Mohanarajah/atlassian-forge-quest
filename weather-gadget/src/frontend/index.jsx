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
        {showOptions && <Button appearance="primary" type="submit" onClick={handleSubmit(configureGadget)}>
          Submit
        </Button>}
      </FormFooter>
    </Form>
    </>
  );
};

const View = () => {
  const [weather, setWeather] = useState(null);
  const context = useProductContext();

  useEffect(() => {
    invoke('getCurrentWeather').then(setWeather);
  }, []);

  const containerStyle = xcss({
    padding: 'space.200'
  });

  return (
    <>
      <Heading as="h2">{weather ? weather.name : 'Loading...'} Weather</Heading>
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
