import express from "express";
import bcrypt from "bcryptjs";
const userRouter = express.Router();
import pool from "./PoolConnection.js";


//login user
userRouter.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    console.log(result);

    const isValidPassword = await bcrypt.compare(password, result.rows[0].password);
		
    if (!isValidPassword) {
      console.log("PASSWORD NOT VALID")
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    // const accessToken = jwt.sign({ user_id: result.rows[0].user_id, fname: result.rows[0].firstname, lname: result.rows[0].lastname, type: result.rows[0].user_type, pic: result.rows[0].picture, role: "authenticated" });

    // let refreshToken = jwt.sign({ user_id: result.rows[0].user_id, fname: result.rows[0].firstname, lname: result.rows[0].lastname, type: result.rows[0].user_type, pic: result.rows[0].picture, role: "authenticated" })

    // await pool.query(
    //   "INSERT INTO user_sessions (user_id, refresh_token) VALUES ($1, $2)",
    //   [user.rows[0].user_id, refreshToken]
    // );

    // res.cookie("refresh_token", refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production", // Only send over HTTPS
    //   sameSite: "Strict",
    //   maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    // });

    // res.json({ success: true, user: result.rows[0], accessToken });
    res.json({ success: true, user: result.rows[0] });
    
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

    // Hashes the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Checks if user is registering with an organization
    if (user_type === "organization_member") { 

      // Checks to make sure a company name was input
      if (companyName) {

        // First, attempts to create a new user. This will cause a 500 error if there is already a user. This is expected & desired behavior.
        // Then, attempts to create a new org if there is not one. If there is one, new_org does nothing.
        // Then, creates the org member link. It takes the newly created user ID, then also does a check for either the new org or the ID for the org if it already existed.
        // All that being done, it returns the newly created user's ID.
        const user = await pool.query(`
            WITH new_user AS (
              INSERT INTO users (firstname, lastname, email, password, city, user_type)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING user_id
            ),
            new_org AS (
              INSERT INTO organization (name)
              VALUES ($7)
              ON CONFLICT (name) DO NOTHING
              RETURNING organization_id
            )
            INSERT INTO organization_member (member_id, role, organization_id)
            SELECT 
              new_user.user_id,
              'member', 
              COALESCE(new_org.organization_id, (SELECT organization_id FROM organization WHERE name = $7))
            FROM new_user
            LEFT JOIN new_org ON TRUE
            RETURNING member_id
          `,
        [firstName, lastName, email, hashedPassword, city, user_type, companyName]);

      } else {
        // This runs if no company name was provided.
        return res.status(400).json({ success: false, message: "You must provide a company name" });
      }
    } else {

      // To create a student user. This will cause a 500 error if there is already a user. This is expected & desired behavior.
      const user = await pool.query(`
        INSERT INTO users (firstname, lastname, email, password, city, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `,
      [firstName, lastName, email, hashedPassword, city, user_type]
      );
    }
    res.status(201).json({ success: true, message: "User registered successfully" });

  } catch (error) {
    console.error("Registration error:", error);
    
    // Check if error is a duplicate email issue
    if (error.code === '23505') { // PostgreSQL unique violation error code
        return res.status(409).json({ success: false, message: "Email already in use. Try another one." });
    }

    res.status(500).json({ success: false, message: "Server error (is your email already in use?)" });
}
});

export default userRouter;