import express from "express";
const stuAluRouter = express.Router();
import pool from "./PoolConnection.js";

//get all stuAlus in the database
stuAluRouter.get("/stuAlus", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from student_alumni");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });

  //get stuAlu from the database based on id. need to make it to where you can get it on name also. maybe part of search function(not just posts but ppl too)
stuAluRouter.get("/getStuAlu", async (req, res) => {
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
  stuAluRouter.get("/delStuAlu", async (req, res)=> {
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

  stuAluRouter.put("/updateStuAlu", async (req, res) => {
    const {
      student_alumni_id,
      bio,
      graduation_year,
      major,
      experience
    } = req.body;

    try{
      const result = await pool.query(
        "UPDATE student_alumni SET bio = $1, graduation_year = $2, major = $3, experience = $4 WHERE student_alumni_id = $5",
        [bio, graduation_year, major, experience, student_alumni_id]
      );
      res.json({updated: result.rows[0]});
    }
    catch (error){
      console.alert("Update Student Alumni Error");
      res.status(500).json({ error: "Update Student Alumni failed" });
    }
  });

export default stuAluRouter;