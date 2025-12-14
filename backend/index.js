require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const pool = require("./db");

const app = express();

/* =========================
   MIDDLEWARE (ORDER MATTERS)
========================= */
app.use(cors());                 // ✅ MUST be first
app.use(express.json());

const upload = multer({ dest: "uploads/" });

/* =========================
   HEALTH CHECK
========================= */
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

/* =========================
   SINGLE REPORT SUBMISSION
========================= */
app.post("/report", async (req, res) => {
  try {
    const {
      ngoId,
      month,
      peopleHelped,
      eventsConducted,
      fundsUtilized
    } = req.body;

    if (!ngoId || !month) {
      return res.status(400).json({
        success: false,
        error: "NGO ID and month are required"
      });
    }

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
      [ngoId, month, peopleHelped, eventsConducted, fundsUtilized]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Failed to save report"
    });
  }
});

/* =========================
   BULK CSV UPLOAD (ASYNC)
========================= */
app.post("/reports/upload", upload.single("file"), async (req, res) => {
  const jobId = uuidv4();

  await pool.query(
    `
    INSERT INTO jobs (id, total_rows, status)
    VALUES ($1, 0, 'PROCESSING')
    `,
    [jobId]
  );

  res.json({ success: true, jobId });

  processCsvInBackground(jobId, req.file.path);
});

/* =========================
   BACKGROUND CSV PROCESSOR
========================= */
async function processCsvInBackground(jobId, filePath) {
  let total = 0;
  let processed = 0;
  let success = 0;
  let failed = 0;
  const errors = [];

  const rows = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      rows.push(row);
    })
    .on("end", async () => {
      total = rows.length;

      await pool.query(
        `UPDATE jobs SET total_rows = $1 WHERE id = $2`,
        [total, jobId]
      );

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        processed++;

        try {
          if (!r.ngoId || !r.month) {
            throw new Error("Missing NGO ID or month");
          }

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
              r.ngoId,
              r.month,
              Number(r.peopleHelped),
              Number(r.eventsConducted),
              Number(r.fundsUtilized)
            ]
          );

          success++;
        } catch (err) {
          failed++;
          errors.push({
            row: i + 1,
            error: err.message
          });
        }

        await pool.query(
          `
          UPDATE jobs
          SET processed_rows = $1,
              success_rows = $2,
              failed_rows = $3
          WHERE id = $4
          `,
          [processed, success, failed, jobId]
        );
      }

      await pool.query(
        `
        UPDATE jobs
        SET status = 'COMPLETED',
            error_log = $1
        WHERE id = $2
        `,
        [JSON.stringify(errors), jobId]
      );

      fs.unlinkSync(filePath);
    });
}

/* =========================
   JOB STATUS
========================= */
app.get("/job-status/:jobId", async (req, res) => {
  try {
    let { jobId } = req.params;
    jobId = jobId.replace(/[<>]/g, "");

    const result = await pool.query(
      "SELECT * FROM jobs WHERE id = $1",
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Job not found"
      });
    }

    res.json({ success: true, job: result.rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* =========================
   DASHBOARD
========================= */
app.get("/dashboard", async (req, res) => {
  try {
    const { month } = req.query;

    const result = await pool.query(
      `
      SELECT
        COUNT(DISTINCT ngo_id) AS total_ngos,
        COALESCE(SUM(people_helped), 0) AS total_people_helped,
        COALESCE(SUM(events_conducted), 0) AS total_events,
        COALESCE(SUM(funds_utilized), 0) AS total_funds
      FROM reports
      WHERE month = $1
      `,
      [month]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/* =========================
   SERVER START (RENDER SAFE)
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
