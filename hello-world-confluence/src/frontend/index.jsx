import React, { useEffect, useState } from 'react';
import ForgeReconciler, { Heading, Lozenge, Text } from '@forge/react';
import { invoke, view, requestConfluence } from '@forge/bridge'

const App = () => {
  const [data, setData] = useState(null);
  const [theme, setTheme] = useState(null);
  const [accountID, setAccountID] = useState(null);
  const [name, setName] = useState(null);

  useEffect(() => {
    const getUserInfo = async() => {
      if(accountID) {
        let bodyData = `{
          "accountIds": [
            "${accountID}"
          ]
        }`;

        const response = await requestConfluence(`/wiki/api/v2/users-bulk`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: bodyData
        });
        if(response.status === 200) {
          let data = await response.json();
          console.log(data);

          setName(data.results[0].publicName);
        } else 
        { 
          console.log(response)
        }
      } else {
        console.log("accountID is null")
      }
    }

    getUserInfo();

  }, [accountID]);

  useEffect(() => {
    const getTheme = async() => {
      const context = await view.getContext();
      console.log(context);
      setTheme(context.theme.colorMode);
      setAccountID(context.accountId);
    }

    getTheme();
  }, []);

  useEffect(() => {
    invoke('getText', { example: 'my-invoke-variable' }).then(setData);
  }, []);

  return (
    <>
      <Heading size="xlarge">Hello {name ? name: 'World'}!</Heading>
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
