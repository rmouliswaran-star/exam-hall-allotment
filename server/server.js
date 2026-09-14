const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./src/config/db");

const departmentRoutes = require("./src/routes/departmentRoutes");
const studentRoutes = require("./src/routes/studentRoutes");
const examRoutes = require("./src/routes/examRoutes");
const hallRoutes = require("./src/routes/hallRoutes");
const examStudentRoutes = require("./src/routes/examStudentRoutes");
const allotmentRoutes = require("./src/routes/allotmentRoutes");
const authRoutes = require("./src/routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());
app.use(express.json());

// ============================================================
// ROOT API
// ============================================================

app.get("/", (req, res) => {
res.json({
success: true,
message: "Exam Hall Allotment API is running",
});
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {
try {
const [rows] = await db.query(
"SELECT 1 AS database_connected"
);

```
res.json({
  success: true,
  message: "Server and MySQL are connected",
  database: rows[0].database_connected === 1,
});
```

} catch (error) {
console.error("Database connection error:", error);

```
res.status(500).json({
  success: false,
  message: "Database connection failed",
  error: error.message,
});
```

}
});

// ============================================================
// DEPARTMENT API
// ============================================================

app.use(
"/api/departments",
departmentRoutes
);

// ============================================================
// STUDENT API
// ============================================================

app.use(
"/api/students",
studentRoutes
);

// ============================================================
// EXAM API
// ============================================================

app.use(
  "/api/exams",
  examRoutes
);

// ============================================================
// EXAM STUDENTS API
// ============================================================

app.use(
  "/api/exams",
  examStudentRoutes
);

// ============================================================
// HALL API
// ============================================================

app.use(
  "/api/halls",
  hallRoutes
);

// ============================================================
// ALLOTMENT API
// ============================================================

app.use(
  "/api/allotments",
  allotmentRoutes
);

// ============================================================
// AUTH API
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
res.status(404).json({
success: false,
message: "API endpoint not found",
path: req.originalUrl,
});
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
console.error("Server error:", err);

res.status(500).json({
success: false,
message: "Internal server error",
});
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
console.log("==========================================");
console.log(" Exam Hall Allotment Server");
console.log("==========================================");
console.log(`Server: http://localhost:${PORT}`);
console.log(`Health: http://localhost:${PORT}/api/health`);
console.log(`Departments: http://localhost:${PORT}/api/departments`);
console.log(`Students: http://localhost:${PORT}/api/students`);
console.log("==========================================");
});