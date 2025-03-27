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
  orgRouter.delete("/delOrg", async (req, res)=> {
    try{
      var id1= req.query.organization_id;
      console.log(id1);
    const result = await pool.query("DELETE FROM organization WHERE organization_id = "+id1);
    //Checks if anything actually got deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization not found" });
    }
      console.log(result);
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error("Query error: ", error);
      res.status(500).json({ error: "Database query failed" });
    }
  });

export default orgRouter;