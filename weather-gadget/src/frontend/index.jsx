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
} from "@forge/react";
import { invoke, view } from "@forge/bridge";
const FIELD_NAME = "field-name";

export const Edit = () => {
  const { handleSubmit, register, getFieldId } = useForm();

  const configureGadget = (data) => {
    view.submit(data);
  };

  return (
    <Form onSubmit={handleSubmit(configureGadget)}>
      <FormSection>
        <Label labelFor={getFieldId(FIELD_NAME)}>
          Value
          <RequiredAsterisk />
        </Label>
        <Textfield {...register(FIELD_NAME, { required: true })} />
      </FormSection>
      <FormFooter>
        <Button appearance="primary" type="submit">
          Submit
        </Button>
      </FormFooter>
    </Form>
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
      <Text>Value: {gadgetConfiguration[FIELD_NAME]}</Text>
      <Text>{data ? data : 'Loading...'}</Text>
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
