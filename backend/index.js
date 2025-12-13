const express = require("express");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
