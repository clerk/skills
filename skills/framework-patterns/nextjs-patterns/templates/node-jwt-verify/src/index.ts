import express from "express";

const app = express();

app.get("/api/data", (req, res) => {
  // TODO: Verify the Bearer token from Authorization header
  // Currently unprotected - any request gets data
  const data = [
    { id: 1, name: "Project Alpha" },
    { id: 2, name: "Project Beta" },
  ];
  res.json(data);
});

app.listen(3001, () => console.log("API server on :3001"));
