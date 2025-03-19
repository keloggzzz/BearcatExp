import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

const app=express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use(cors());


dotenv.config(); // Load environment variables
const { Pool } = pg;

const PORT = process.env.PORT || 8000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon DB
  },
});

pool.connect()
  .then(client => {
    console.log("Connected to Neon PostgreSQL database!");
    client.release();
  })
  .catch(err => console.error("Database connection error:", err.stack));


 app.get("/", async (req, res) => {
    try {
     
          res.send("Bearcat Board Express Server");
     
    } catch (error) {
      console.error("Query error:", error);
      res.send(" Sorry Error")
     
    }
  });
 //
app.listen(8000, () => console.log("Server ready on port 8000."));