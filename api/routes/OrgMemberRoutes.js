import express from "express";
import jwt from "jsonwebtoken";
const orgMemberRouter = express.Router();
import pool from "./PoolConnection.js";

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

//get all organization members in the database
orgMemberRouter.get("/orgMembers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * from organization_member");
    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database query failed" });

  }
});

//get one organization member from the database based on member_id....make another one to get from their name
orgMemberRouter.get("/getOrgMember", authenticateToken, async (req, res) => {
  try {
    var id1 = req.query.member_id;
    console.log(id1);
    const result = await pool.query("select * from organization_member where member_id=" + id1);
    console.log(result);
    res.json({ rows: result.rows });

  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});

//Upate org member based on id.
orgMemberRouter.put("/updateOrgMember", authenticateToken, async (req, res) => {
  const { member_id, organization_id } = req.body;
  console.log("Incoming update data:", req.body);

  try {
    const result = await pool.query(
      `UPDATE organization_member 
        SET organization_id = $1
         WHERE member_id = $2 
         RETURNING *`,
      [organization_id, member_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Organization member not found" });
    }
    res.json({ updated: true });
  } catch (error) {
    console.error("Update org member error:", error);
    res.status(500).json({ success: false, message: "Failed to update organization member" });
  }
});



//delete organization member based on id. 
orgMemberRouter.delete("/delOrgMember", authenticateToken, async (req, res) => {
  try {
    var id1 = req.query.member_id;
    console.log(id1);
    const result = await pool.query("Delete member from organization_member where member_id = " + id1);
    console.log(result);
    res.json({ ans: 1 });

  } catch (error) {
    console.error("Query error: ", error);
    res.json({ ans: 0 });
  }
})

// Get all members for a specific organization
orgMemberRouter.get("/getByOrg", authenticateToken, async (req, res) => {
  const { organization_id } = req.query;

  if (!organization_id) {
    return res.status(400).json({ error: "Missing organization_id" });
  }

  try {
    const result = await pool.query(
      `SELECT u.user_id, u.firstname, u.lastname, u.picture
       FROM users u
       INNER JOIN organization_member om ON u.user_id = om.member_id
       WHERE om.organization_id = $1`,
      [organization_id]
    );

    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Failed to fetch members by organization:", error);
    res.status(500).json({ error: "Server error fetching org members" });
  }
});


export default orgMemberRouter;