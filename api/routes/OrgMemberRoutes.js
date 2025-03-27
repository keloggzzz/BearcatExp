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

  orgMemberRouter.get("/updateOrgMember", async (req, res) => {
    const {member_id, organization_id, user_id, role} = req.body;
    try {
      const result = await pool.query(
        "UPDATE organization_member SET organization_id = $1, user_id = $2, role = $3 WHERE member_id = $4",
        [organization_id, user_id, role, member_id]

      );
      res.json({updated: result.rows[0]});
    } catch (error){
      console.alert("Update organization member error: ", error);
      res.status(500).json({ error: "Update organization member failed" });
    }
    });

  //delete organization member based on id. 
  orgMemberRouter.get("/delOrgMember", async (req, res)=> {
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