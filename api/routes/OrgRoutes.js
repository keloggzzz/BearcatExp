import express from "express";
const orgRouter = express.Router();
import pool from "./PoolConnection.js";

//get all organizations in the database
orgRouter.get("/orgs", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from organization");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });

  //get one organization from the database based on organization id. also need to make one to find based on name
orgRouter.get("/getOrg", async (req, res) => {
    try {
      var id1=req.query.organization_id;
      console.log(id1);
      const result = await pool.query("select * from organization where organization_id="+id1);
      console.log(result);
      res.json({rows:result.rows});
     
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });     
    }
  });

  //delete an organization. this should only be allowed by admins of the org_members...need to add more functionality for this
  orgRouter.get("/delOrg", async (req, res)=> {
    try{
      var id1= req.query.organization_id;
      console.log(id1);
    const result = await pool.query("Delete organization from posts where organization_id = "+id1);
    console.log(result);
    res.json({ans: 1});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: 0});
    }
  });

export default orgRouter;