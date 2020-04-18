import React, {useEffect, useState} from 'react';
import './App.css';
import axois from 'axios';

const apiBase = process.env.REACT_APP_LOCAL_API;

function App() {
  const [isLoading, setLoading] = useState(true);
  const [data, setData] = useState();

  useEffect(() => {
    const getConfig = async () => {
      const result = await axois.get(`${apiBase}/config`);

      console.log(result.data);
      setData(result.data);
      setLoading(false);
    };

    getConfig();
  }, []);

  return !isLoading ? (
    <div>
      <code>{JSON.stringify(data)}</code>
    </div>
  ) : (
    <h2>loading...</h2>
  );
}

export default App;
