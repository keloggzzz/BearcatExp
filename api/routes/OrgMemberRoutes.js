import express from "express";
const orgMemberRouter = express.Router();
import pool from "./PoolConnection.js";

//get all organization members in the database
orgMemberRouter.get("/orgMembers", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from organization_member");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });

  //get one organization member from the database based on member_id....make another one to get from their name
orgMemberRouter.get("/getOrgMember", async (req, res) => {
    try {
      var id1=req.query.member_id;
      console.log(id1);
      const result = await pool.query("select * from organization_member where member_id="+id1);
      console.log(result);
      res.json({rows:result.rows});
     
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });     
    }
  });

  //Upate org member based on id.
  orgMemberRouter.put("/updateOrgMember", async (req, res) => {
    const { member_id, organization_id, role } = req.body;
    console.log("Incoming update data:", req.body);

    try {
      const result = await pool.query(
        `UPDATE organization_member 
         SET organization_id = $1, role = $2 
         WHERE member_id = $3 
         RETURNING *`,
        [organization_id, role, member_id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Organization member not found" });
      }
      res.json({ updated: result.rowCount > 0 });

    } catch (error) {
      console.error("Update org member error:", error);
      res.status(500).json({ success: false, message: "Failed to update organization member" });
    }
  });
  

  //delete organization member based on id. 
  orgMemberRouter.delete("/delOrgMember", async (req, res)=> {
    try{
      var id1= req.query.member_id;
      console.log(id1);
    const result = await pool.query("Delete member from organization_member where member_id = "+id1);
    console.log(result);
    res.json({ans: 1});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: 0});
    }
  })

export default orgMemberRouter;