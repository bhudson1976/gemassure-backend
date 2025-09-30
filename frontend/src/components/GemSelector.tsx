import React, { useState } from "react";
import gemstones from "../data/gemstones.json";

interface GemSelectorProps {
  onSelect: (gem: string) => void;
}

const GemSelector: React.FC<GemSelectorProps> = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      const matches = gemstones.filter((gem) =>
        gem.toLowerCase().includes(value.toLowerCase())
      );
      setFiltered(matches);
    } else {
      setFiltered([]);
    }
  };

  const handleSelect = (gem: string) => {
    setQuery(gem);
    setFiltered([]);
    onSelect(gem);
  };

  return (
    <div style={{ position: "relative", width: "300px" }}>
      <input
        type="text"
        placeholder="Start typing a gemstone..."
        value={query}
        onChange={handleChange}
        style={{ width: "100%", padding: "8px", fontSize: "16px" }}
      />
      {filtered.length > 0 && (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: "4px",
            border: "1px solid #ccc",
            background: "#fff",
            position: "absolute",
            width: "100%",
            zIndex: 10,
          }}
        >
          {filtered.map((gem) => (
            <li
              key={gem}
              onClick={() => handleSelect(gem)}
              style={{
                padding: "6px",
                cursor: "pointer",
                borderBottom: "1px solid #eee",
              }}
            >
              {gem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GemSelector;
