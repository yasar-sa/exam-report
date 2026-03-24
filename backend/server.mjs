import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import reportRoutes from "./routes/reportRoutes.js";
import dataRoutes from "./routes/dataRoutes.js";


const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/reports", reportRoutes);
app.use("/api", dataRoutes);

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});