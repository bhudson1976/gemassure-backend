import React, { useState } from "react";
import "./App.css";

function App() {
  const [gemType, setGemType] = useState("");
  const [carat, setCarat] = useState("");
  const [metalType, setMetalType] = useState("");
  const [metalWeight, setMetalWeight] = useState("");
  const [result, setResult] = useState("");

  const handleEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Running handleEstimate with:", { carat, metalWeight });

    try {
      const response = await fetch("http://localhost:5000/api/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gemType,
          carat: parseFloat(carat),
          metalType,
          metalWeight: parseFloat(metalWeight),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("💎 API response:", data);

      if (data.totalValue) {
        setResult(`Estimated Value: $${data.totalValue.toFixed(2)}`);
      } else {
        setResult("No estimate returned. Please check your inputs.");
      }
    } catch (error) {
      console.error("❌ API call failed:", error);
      setResult("Error fetching estimate. Please try again.");
    }
  };

  return (
    <div
      className="App"
      style={{
        padding: "2rem",
        fontFamily: "sans-serif",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      <h1>💎 GemAssure Estimator</h1>
      <form onSubmit={handleEstimate}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Gem Type:</label>
          <input
            type="text"
            value={gemType}
            onChange={(e) => setGemType(e.target.value)}
            placeholder="e.g. Diamond"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Carat Weight:</label>
          <input
            type="number"
            value={carat}
            onChange={(e) => setCarat(e.target.value)}
            placeholder="e.g. 1.5"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Metal Type:</label>
          <input
            type="text"
            value={metalType}
            onChange={(e) => setMetalType(e.target.value)}
            placeholder="e.g. Gold"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label>Metal Weight (grams):</label>
          <input
            type="number"
            value={metalWeight}
            onChange={(e) => setMetalWeight(e.target.value)}
            placeholder="e.g. 14.2"
            style={{ width: "100%", padding: "0.5rem" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "0.75rem",
            width: "100%",
            fontWeight: "bold",
          }}
        >
          Estimate Value
        </button>
      </form>

      {result && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            background: "#f5f5f5",
            borderRadius: "6px",
          }}
        >
          <h3>Result</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
}

export default App;
