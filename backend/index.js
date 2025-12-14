const cors = require("cors");

const upload = require("./upload");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const csv = require("csv-parser");

require("dotenv").config();
const express = require("express");
const pool = require("./db");

const app = express();

async function processCsvInBackground(jobId, filePath) {
  let totalRows = 0;
  let processedRows = 0;
  let successRows = 0;
  let failedRows = 0;
  const errorLog = [];

  // Mark job as processing
  await pool.query(
    "UPDATE jobs SET status = $1 WHERE id = $2",
    ["PROCESSING", jobId]
  );

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (row) => {
      totalRows++;
      processedRows++;

      const {
        ngoId,
        month,
        peopleHelped,
        eventsConducted,
        fundsUtilized
      } = row;

      // Basic validation
      if (
        !ngoId ||
        !month ||
        !peopleHelped ||
        !eventsConducted ||
        !fundsUtilized
      ) {
        failedRows++;
        errorLog.push({
          row: totalRows,
          error: "Missing required fields"
        });
      } else {
        try {
          await pool.query(
            `
            INSERT INTO reports
            (ngo_id, month, people_helped, events_conducted, funds_utilized)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (ngo_id, month)
            DO UPDATE SET
              people_helped = EXCLUDED.people_helped,
              events_conducted = EXCLUDED.events_conducted,
              funds_utilized = EXCLUDED.funds_utilized
            `,
            [
              ngoId,
              month,
              Number(peopleHelped),
              Number(eventsConducted),
              Number(fundsUtilized)
            ]
          );
          successRows++;
        } catch (err) {
          failedRows++;
          errorLog.push({
            row: totalRows,
            error: err.message
          });
        }
      }

      // Update progress every row (simple & safe)
      await pool.query(
        `
        UPDATE jobs
        SET
          total_rows = $1,
          processed_rows = $2,
          success_rows = $3,
          failed_rows = $4,
          error_log = $5
        WHERE id = $6
        `,
        [
          totalRows,
          processedRows,
          successRows,
          failedRows,
          JSON.stringify(errorLog),
          jobId
        ]
      );
    })
    .on("end", async () => {
      await pool.query(
        "UPDATE jobs SET status = $1 WHERE id = $2",
        ["COMPLETED", jobId]
      );

      // Clean up file
      fs.unlinkSync(filePath);
    })
    .on("error", async (err) => {
      await pool.query(
        "UPDATE jobs SET status = $1 WHERE id = $2",
        ["FAILED", jobId]
      );
      console.error("CSV processing error:", err);
    });
}

// Middleware to parse JSON
app.use(express.json());

app.use(cors());

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

app.get("/job-status/:jobId", async (req, res) => {
  try {
    let jobId = req.params.jobId;

    // 🔐 Defensive sanitization
    jobId = jobId.replace(/<|>/g, "").trim();

    const result = await pool.query(
      "SELECT * FROM jobs WHERE id = $1::uuid",
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({
      success: true,
      job: result.rows[0]
    });
  } catch (error) {
    console.error("JOB STATUS ERROR:", error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


app.post("/reports/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "CSV file is required"
    });
  }

  const jobId = uuidv4();

  // Create job entry
  await pool.query(
    `INSERT INTO jobs (id, total_rows, status)
     VALUES ($1, $2, $3)`,
    [jobId, 0, "PENDING"]
  );

  // Start background processing (next step)
  processCsvInBackground(jobId, req.file.path);

  res.json({
    success: true,
    jobId
  });
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




const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
