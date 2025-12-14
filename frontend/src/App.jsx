import ReportForm from "./components/ReportForm";
import CsvUpload from "./components/CsvUpload";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>NGO Impact Reporting</h1>

      <hr />
      <ReportForm />

      <hr />
      <CsvUpload />

      <hr />
      <Dashboard />
    </div>
  );
}

export default App;
