import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Heading, Lozenge, Text } from '@forge/react';
import { invoke, view } from '@forge/bridge';

const App = () => {
  const [data, setData] = useState(null);
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const getTheme = async() => {
      const context = await view.getContext();
      setTheme(context.theme.colorMode);
    }

    getTheme();
  }, []);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <>
      <Heading size="xlarge">Hello world!</Heading>
      <Text>{data ? data : 'Loading...'}</Text>
      <Text>Current theme: <Lozenge>{theme ? theme : 'Loading...'}</Lozenge></Text>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
