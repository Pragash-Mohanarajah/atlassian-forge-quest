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
} from "@forge/react";
import { invoke, view } from "@forge/bridge";

let currentCC = null;

export const Edit = () => {
  const { handleSubmit, register, getValues, formState } = useForm();
  const [locationOptions, setLocationOptions] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const { errors } = formState;

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
    view.submit(locationOptions[data.location])
  }

  function locationOption(obj, index, array) {
    return { name: "location", label: obj.name + ", " + obj.state + ", " + obj.country, value: index }
  }

  return (
    <>
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label>City<RequiredAsterisk /></Label>
        <Textfield {...register("city", { required: true, onChange: getOptions() })} />
        <Label>Country<RequiredAsterisk /></Label>
        <Textfield {...register("country", { required: true })} />
        {showOptions && <Label>Select your location<RequiredAsterisk /></Label>}
        {showOptions && (
          <RadioGroup {...register("location", {required: true})} options={locationOptions.map(locationOption)}/>
        )}
        {errors["location"] && <ErrorMessage>Select a location</ErrorMessage>}
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
  const [data, setData] = useState(null);
  const context = useProductContext();

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  if (!context) {
    return "Loading...";
  }
  const {
    extension: { gadgetConfiguration },
  } = context;

  return (
    <>
      <Text>City: {gadgetConfiguration["name"] ? gadgetConfiguration["name"] : "Edit me"}</Text>
      <Text>Country: {gadgetConfiguration["country"] ? gadgetConfiguration["country"] : "Edit me"}</Text>
      <Text>Lon: {gadgetConfiguration["lon"] ? gadgetConfiguration["lon"] : "Edit me"}</Text>
      <Text>Lat: {gadgetConfiguration["lat"] ? gadgetConfiguration["lat"] : "Edit me"}</Text>
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
