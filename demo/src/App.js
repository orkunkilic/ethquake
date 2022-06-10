import React from "react"
import { useNavigate } from "react-router-dom";
import { GeistProvider, CssBaseline, Button, Text } from '@geist-ui/core'

function App() {
  let navigate = useNavigate();

  return (
    <GeistProvider>
    <CssBaseline />
      <div style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center", 
        flexDirection: "column"
      }}>
        <Text h1>De-Insurance</Text>
        <Button width="300px" mt={3} onClick={() => navigate('/insure')}>Insurance</Button>
        <Button width="300px" mt={3} onClick={() => navigate('/issue')}>Issue Deed NFT</Button>
        <Button width="300px" mt={3} onClick={() => navigate('/transfer')}>Transfer Deed</Button>
      </div>
    </GeistProvider>
  );

}

export default App;
