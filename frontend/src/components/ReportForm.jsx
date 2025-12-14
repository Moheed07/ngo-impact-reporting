import { useState } from "react";

const API_BASE = "https://ngo-impact-backend-fqeg.onrender.com";

function ReportForm() {
  const [form, setForm] = useState({
    ngoId: "",
    month: "",
    peopleHelped: "",
    eventsConducted: "",
    fundsUtilized: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const submitReport = async () => {
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ngoId: form.ngoId,
          month: form.month,
          peopleHelped: Number(form.peopleHelped),
          eventsConducted: Number(form.eventsConducted),
          fundsUtilized: Number(form.fundsUtilized)
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Report submitted successfully ✅");
        setForm({
          ngoId: "",
          month: "",
          peopleHelped: "",
          eventsConducted: "",
          fundsUtilized: ""
        });
      } else {
        alert(data.error || "Failed to submit report");
      }
    } catch (err) {
      alert("Backend not reachable");
    }
  };

  return (
    <div>
      <h2>Submit Monthly Report</h2>

      <input
        name="ngoId"
        placeholder="NGO ID"
        value={form.ngoId}
        onChange={handleChange}
      />

      <input
        name="month"
        placeholder="Month (YYYY-MM)"
        value={form.month}
        onChange={handleChange}
      />

      <input
        name="peopleHelped"
        placeholder="People Helped"
        value={form.peopleHelped}
        onChange={handleChange}
      />

      <input
        name="eventsConducted"
        placeholder="Events Conducted"
        value={form.eventsConducted}
        onChange={handleChange}
      />

      <input
        name="fundsUtilized"
        placeholder="Funds Utilized"
        value={form.fundsUtilized}
        onChange={handleChange}
      />

      <br />
      <button onClick={submitReport}>Submit Report</button>
    </div>
  );
}

export default ReportForm;
