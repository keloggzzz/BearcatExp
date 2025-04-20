import express from "express";
const orgRouter = express.Router();
import pool from "./PoolConnection.js";

//get all organizations in the database
orgRouter.get("/orgs", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from organization ORDER BY name ASC");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });

  //get one organization from the database based on organization id. also need to make one to find based on name
  orgRouter.get("/getOrg", async (req, res) => {
    try {
      const id1 = req.query.organization_id;
  
      if (!id1) {
        return res.status(400).json({ error: "Missing organization_id" });
      }
  
      const result = await pool.query("SELECT * FROM organization WHERE organization_id = $1", [id1]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Organization not found" });
      }
  
      res.json({ rows: result.rows });
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
  // Create a new organization

orgRouter.post("/createOrg", async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO organization (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING *`,
      [name]
    );

    // If org was not inserted (already exists), fetch the existing one
    if (result.rows.length === 0) {
      const existing = await pool.query(
        "SELECT * FROM organization WHERE name = $1", [name]
      );
      return res.json(existing.rows[0]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Org creation failed:", err);
    res.status(500).json({ error: "Organization creation failed" });
  }
});


//update organization
orgRouter.put("/updateOrg", async (req, res) => {
  console.log("Incoming update request:", req.body);

  let { organization_id, name, description } = req.body;
  const orgId = parseInt(organization_id);

  if (!orgId || !name) {
    return res.status(400).json({ success: false, message: "Missing or invalid fields" });
  }

  try {
    const result = await pool.query(
      "UPDATE organization SET name = $1, description = $2 WHERE organization_id = $3 RETURNING *",
      [name, description, orgId]
    );
    res.json({ success: true, org: result.rows[0] });
  } catch (error) {
    console.error("Error updating organization:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});




export default orgRouter;