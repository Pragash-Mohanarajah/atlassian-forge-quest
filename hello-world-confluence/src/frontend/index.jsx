import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Heading, Text } from '@forge/react';
import { invoke } from '@forge/bridge';

const App = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <>
      <Heading size="xlarge">Hello world!</Heading>
      <Text>{data ? data : 'Loading...'}</Text>
    </>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
