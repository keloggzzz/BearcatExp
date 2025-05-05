import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import pool from "./routes/PoolConnection.js";
import postRouter from "./routes/PostsRoutes.js";
import orgMemberRouter from "./routes/OrgMemberRoutes.js";
import orgRouter from "./routes/OrgRoutes.js";
import stuAluRouter from "./routes/StudAlumRoutes.js";
import userRouter from "./routes/UserRoutes.js";
import authRouter from "./routes/AuthRoutes.js";

const app=express();
const allowedOrigins = ["https://www.bear.careers", "https://bear.careers", "http://localhost:5173"];

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true, // 🔥 This allows cookies, auth headers, etc.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

app.use("/post", postRouter);
app.use("/orgMember", orgMemberRouter);
app.use("/org", orgRouter);
app.use("/stuAlu", stuAluRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);



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