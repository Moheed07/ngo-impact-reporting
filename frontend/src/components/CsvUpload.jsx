import { useState } from "react";

const API_BASE = "https://ngo-impact-backend-fqeg.onrender.com";

function CsvUpload() {
  const [file, setFile] = useState(null);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);

  const uploadCsv = async () => {
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/reports/upload`, {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Upload failed");
        return;
      }

      setJob({ id: data.jobId });
    } catch (err) {
      setError("Backend not reachable");
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/job-status/${job.id}`);
      const data = await res.json();

      if (data.success) {
        setJob(data.job);
      } else {
        setError(data.error || "Failed to fetch status");
      }
    } catch (err) {
      setError("Failed to fetch job status");
    }
  };

  return (
    <div>
      <h2>Bulk CSV Upload</h2>

      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <button onClick={uploadCsv} disabled={!file}>
        Upload CSV
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {job && (
        <div>
          <p>Status: {job.status}</p>
          <p>Total Rows: {job.total_rows}</p>
          <p>Processed: {job.processed_rows}</p>
          <p>Success: {job.success_rows}</p>
          <p>Failed: {job.failed_rows}</p>

          {job.status !== "COMPLETED" && (
            <button onClick={fetchStatus}>Refresh Status</button>
          )}
        </div>
      )}
    </div>
  );
}

export default CsvUpload;
