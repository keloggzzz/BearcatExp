import express from "express";
const userRouter = express.Router();
import pool from "./PoolConnection.js";


//login user
userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login query error:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get all users in the database
userRouter.get("/allUsers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * from users");
    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database query failed" });

  }
});

//this should only be allowed for the logged in user to access their entire profile. 
userRouter.get("/getuser", async (req, res) => {
  try {
    const id = req.query.user_id;

    const result = await pool.query(`
      SELECT 
        u.*, 
        sa.graduation_year, 
        sa.major, 
        sa.bio, 
        sa.experience,
        o.name AS organization_name
      FROM users u
      LEFT JOIN student_alumni sa 
        ON u.user_id = sa.student_alumni_id
      LEFT JOIN organization_member om 
        ON u.user_id = om.member_id
      LEFT JOIN organization o 
        ON om.organization_id = o.organization_id
      WHERE u.user_id = $1
    `, [id]);
    

    res.json({ rows: result.rows });

  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});



// Register new user
userRouter.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, city, user_type, companyName } = req.body;
    console.log(req.body);

    if (user_type === "organization_member") { 
      if (companyName) {
        const user = await pool.query(`
            WITH new_user AS (
              INSERT INTO users (firstname, lastname, email, password, city, user_type)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (email) DO NOTHING
              RETURNING id
            ),
            new_org AS (
              INSERT INTO organization (name)
              VALUES ($7)
              WHERE NOT EXISTS (
                SELECT 1 FROM organization WHERE name = $7
              )
              RETURNING id
            )
            INSERT INTO organization_member (member_id, role, organization_id)
            SELECT id FROM new_user, 
            'member', 
            SELECT id FROM new_org
            RETURNING member_id
          `,
        [firstName, lastName, email, password, city, user_type, companyName]);
      } else {
        return res.status(400).json({ success: false, message: "You must provide a company name" });
      }
    } else {
      const user = await pool.query(`
        INSERT INTO users (firstname, lastname, email, password, city, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
        RETURNING id
      `,
      [firstName, lastName, email, password, city, user_type]
      );
    }

    if (user === undefined) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }







    
    // // Check if the email is already in use
    // const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    // if (existingUser.rows.length > 0) {
    //   console.log("Email already registered");
    //   return res.status(400).json({ success: false, message: "Email already registered" });
    // }

    // // Variable to hold organization_id
    // let organization_id = null;

    // // If the user is an organization member (employer), check for the organization in the database
    // if (user_type === "organization_member" && companyName) {
    //   console.log("Looking for organization:", companyName); // Debug
      
    //   // Try to find the organization by company name
    //   const orgResult = await pool.query(
    //     "SELECT organization_id FROM organization WHERE name = $1 LIMIT 1",
    //     [companyName]
    //   );

    //   if (orgResult.rows.length > 0) {
    //     // If the organization exists, use its organization_id
    //     organization_id = orgResult.rows[0].organization_id;
    //     console.log("Organization found, using organization_id:", organization_id); // Debugging log


    //   } else {
    //     // If the organization doesn't exist, insert the company into the organization table
    //     const insertOrgResult = await pool.query(
    //       "INSERT INTO organization (name) VALUES ($1) RETURNING organization_id",
    //       [companyName]
    //     );
    //     organization_id = insertOrgResult.rows[0].organization_id;
    //     console.log("Organization created, new organization_id:", organization_id); // Debugging log
    //   }

    // }

    // // Insert user into the users table
    // const result = await pool.query(
    //   "INSERT INTO users (firstname, lastname, email, password, city, user_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    //   [firstName, lastName, email, password, city, user_type] // Include organization_id
    // );

    // console.log("User inserted:", result.rows[0]); // Debugging log

    // // Insert into organization_member if the user is an organization member
    // if (user_type === "organization_member" && organization_id) {
    //   console.log("Inserting into organization_member with user_id:", result.rows[0].user_id, "and organization_id:", organization_id); // Debugging log
    //   // Insert the user into the organization_member table
    //   const orgMemberInsert = await pool.query(
    //     "INSERT INTO organization_member (member_id, organization_id, role) VALUES ($1, $2, 'member') RETURNING *", // Assuming role is 'employee'
    //     [result.rows[0].user_id, organization_id]
    //   );
    //   console.log("Organization member inserted:", orgMemberInsert.rows[0]); // Debugging log
    // }

    // res.status(201).json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default userRouter;