import express from "express";
const stuAluRouter = express.Router();
import pool from "./PoolConnection.js";
import jwt from "jsonwebtoken";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
}

//get all stuAlus in the database
stuAluRouter.get("/stuAlus", authenticateToken, async (req, res) => {
    try {
      const result = await pool.query("SELECT * from student_alumni");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });

  //get stuAlu from the database based on id. need to make it to where you can get it on name also. maybe part of search function(not just posts but ppl too)
stuAluRouter.get("/getStuAlu", authenticateToken, async (req, res) => {
    try {
      var id1=req.query.student_alumni_id;
      console.log(id1);
      const result = await pool.query("select * from student_alumni where student_alumni_id="+id1);
      console.log(result);
      res.json({rows:result.rows});
     
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });     
    }
  });



  //delete a stuAlu. this should only be allowed to delete their own profile
  stuAluRouter.get("/delStuAlu", authenticateToken, async (req, res)=> {
    try{
      var id1= req.query.student_alumni_id;
      console.log(id1);
      const result = await pool.query("Delete stuAlu from student_alumni where student_alumni_id = "+id1);
      console.log(result);
      res.json({ans: 1});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: 0});
    }
  });

  stuAluRouter.put("/updateStuAlu", authenticateToken, async (req, res) => {
    const {
      student_alumni_id,
      bio,
      graduation_year,
      major,
      experience,
      picture,
      user_id
    } = req.body;

    console.log(req.body) //debug

    try{
      const result = await pool.query(
        "UPDATE student_alumni SET bio = $1, graduation_year = $2, major = $3, experience = $4 WHERE student_alumni_id = $5",
        [bio, graduation_year, major, experience, student_alumni_id]
      );

      // Update picture in users table
    if (picture && user_id) {
      await pool.query(
        "UPDATE users SET picture = $1 WHERE user_id = $2",
        [picture, user_id]
      );
    }

      res.json({ success: true, message: "Student/Alumni updated" });
    }
    catch (error){
      console.error("Update Student Alumni Error");
      res.status(500).json({ error: "Update Student Alumni failed" });
    }
  });


  // Add a student_alumni record
stuAluRouter.post("/addStuAlu", authenticateToken, async (req, res) => {
  const { student_alumni_id, bio, graduation_year, major, experience } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO student_alumni (student_alumni_id, bio, graduation_year, major, experience)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [student_alumni_id, bio, graduation_year, major, experience]);

    res.status(201).json({ success: true, student: result.rows[0] });
  } catch (error) {
    console.error("Insert student_alumni error:", error);
    res.status(500).json({ success: false, message: "Failed to insert student info." });
  }
});

export default stuAluRouter;