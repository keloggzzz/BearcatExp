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

const app=express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use("/post", postRouter);
app.use("/orgMember", orgMemberRouter);
app.use("/org", orgRouter);
app.use("/stuAlu", stuAluRouter);
app.use("/user", userRouter);


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