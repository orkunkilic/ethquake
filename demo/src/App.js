import React from "react"
import { useNavigate } from "react-router-dom";

function App() {
  let navigate = useNavigate();

  const insureHandler = () => {
    navigate("/insure")
  }

  return (
    <div style={{
      display: "flex", alignItems: "center",
      justifyContent: "center", flexDirection: "column"
    }}>
      <button onClick={insureHandler}>Insure Your House</button>
      <button>Register House</button>
      <button>Transfer House</button>
    </div>
  );

}

export default App;
