import { useState } from "react";

const API_BASE = "https://ngo-impact-backend-fqeg.onrender.com";


function Dashboard() {
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setError(null);
    setData(null);

    if (!month) {
      setError("Please enter month in YYYY-MM format");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/dashboard?month=${month}`
      );
      const result = await res.json();

      if (!result.success) {
        setError(result.error || "Failed to load dashboard");
        return;
      }

      setData(result.data);
    } catch (err) {
      setError("Backend not reachable");
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <input
        placeholder="YYYY-MM"
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />

      <button onClick={loadDashboard}>Load Dashboard</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {data && (
        <ul>
          <li>Total NGOs Reporting: {data.total_ngos}</li>
          <li>Total People Helped: {data.total_people_helped}</li>
          <li>Total Events Conducted: {data.total_events}</li>
          <li>Total Funds Utilized: {data.total_funds}</li>
        </ul>
      )}
    </div>
  );
}

export default Dashboard;
