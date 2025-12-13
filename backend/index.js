require("dotenv").config();
const express = require("express");
const pool = require("./db");

const app = express();

// Middleware to parse JSON
app.use(express.json());

// health route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// db-test route MUST be here
app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            success: true,
            time: result.rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post("/report", async (req, res) => {
  const {
    ngoId,
    month,
    peopleHelped,
    eventsConducted,
    fundsUtilized
  } = req.body;

  // Basic validation
  if (
    !ngoId ||
    !month ||
    peopleHelped == null ||
    eventsConducted == null ||
    fundsUtilized == null
  ) {
    return res.status(400).json({
      success: false,
      error: "All fields are required"
    });
  }

  try {
    const query = `
      INSERT INTO reports
      (ngo_id, month, people_helped, events_conducted, funds_utilized)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (ngo_id, month)
      DO UPDATE SET
        people_helped = EXCLUDED.people_helped,
        events_conducted = EXCLUDED.events_conducted,
        funds_utilized = EXCLUDED.funds_utilized
      RETURNING *;
    `;

    const values = [
      ngoId,
      month,
      peopleHelped,
      eventsConducted,
      fundsUtilized
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      report: result.rows[0]
    });
  } catch (error) {
    console.error("DB ERROR:", error.message);
    res.status(500).json({
    success: false,
    error: error.message
    });
  }
});

app.get("/dashboard", async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({
      success: false,
      error: "Month query parameter is required (YYYY-MM)"
    });
  }

  try {
    const query = `
      SELECT
        COUNT(DISTINCT ngo_id) AS total_ngos,
        COALESCE(SUM(people_helped), 0) AS total_people_helped,
        COALESCE(SUM(events_conducted), 0) AS total_events,
        COALESCE(SUM(funds_utilized), 0) AS total_funds
      FROM reports
      WHERE month = $1;
    `;

    const result = await pool.query(query, [month]);

    res.json({
      success: true,
      month,
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard data"
    });
  }
});




const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
