import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const userRouter = express.Router();
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

import multer from "multer";

// Setup storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploadedImages/");
  },
  filename: (req, file, cb) => {
    console.log(file)
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

const JWT_SECRET = process.env.JWT_SECRET;

//login user
userRouter.post("/login", async (req, res) => {

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      `SELECT 
         u.*, 
         om.role AS organization_role 
       FROM users u
       LEFT JOIN organization_member om ON u.user_id = om.member_id
       WHERE u.email = $1`,
      [email]
    );
    

    console.log(result);

    const isValidPassword = await bcrypt.compare(password, result.rows[0].password);

    if (!isValidPassword) {
      console.log("PASSWORD NOT VALID")
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = jwt.sign({ user_id: result.rows[0].user_id, fname: result.rows[0].firstname, lname: result.rows[0].lastname, type: result.rows[0].user_type, pic: result.rows[0].picture, role: "authenticated" }, JWT_SECRET, { expiresIn: "1h" });

    let refreshToken = jwt.sign({ user_id: result.rows[0].user_id, fname: result.rows[0].firstname, lname: result.rows[0].lastname, type: result.rows[0].user_type, pic: result.rows[0].picture, role: "authenticated" }, process.env.REFRESH_SECRET, { expiresIn: "30d" })

    await pool.query(
      "INSERT INTO user_sessions (user_id, refresh_token) VALUES ($1, $2)",
      [result.rows[0].user_id, refreshToken]
    );

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({ success: true, user: result.rows[0], accessToken });

  } catch (error) {
    console.error("Login query error:", error.message, error.stack);
    res.status(500).json({ error: "Internal server error" });
  }
});

//get all users in the database
userRouter.get("/allUsers", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.city,
        u.picture,
        u.user_type,
        o.name AS organization_name
      FROM users u
      LEFT JOIN organization_member om ON u.user_id = om.member_id
      LEFT JOIN organization o ON om.organization_id = o.organization_id
    `);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Query error:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});


//get  user by id
userRouter.get("/getuser", authenticateToken, async (req, res) => {
  try {
    const id = req.user.user_id;

    const result = await pool.query(`
      SELECT 
        u.*, 
        sa.graduation_year, 
        sa.major, 
        sa.bio, 
        sa.experience,
         o.organization_id,
        o.name AS organization_name,
        o.description AS organization_description,
        om.role AS organization_role
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
    const {
      firstName,
      lastName,
      email,
      password,
      city,
      user_type,
      companyName,
      adminCode
    } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user_type === "organization_member") {
      if (!companyName) {
        return res.status(400).json({ success: false, message: "You must provide a company name" });
      }

      const role = adminCode === "BEARCAT123" ? "admin" : "member";

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
          $8,
          COALESCE(new_org.organization_id, (SELECT organization_id FROM organization WHERE name = $7))
        FROM new_user
        LEFT JOIN new_org ON TRUE
        RETURNING member_id
      `, [
        firstName,
        lastName,
        email,
        hashedPassword,
        city,
        user_type,
        companyName,
        role
      ]);

    } else {
      await pool.query(`
        INSERT INTO users (firstname, lastname, email, password, city, user_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING user_id
      `, [firstName, lastName, email, hashedPassword, city, user_type]);
    }

    res.status(201).json({ success: true, message: "User registered successfully" });

  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: "Email already in use. Try another one." });
    }

    res.status(500).json({ success: false, message: "Server error (is your email already in use?)" });
  }
});

//update profile information 
userRouter.put("/updateProfileInfo", authenticateToken, async (req, res) => {
  console.log("Update Profile Info API called!");
  try {
    const info = req.body;
    const user_id = info.user_id;

    if (!user_id) {
      return res.status(400).json({ success: false, error: "Missing user_id" });
    }
    const currentUser = await pool.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
    if (currentUser.rowCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const existing = currentUser.rows[0];

    // Safely assign new values or fall back to current ones
    const firstname = info.firstname || existing.firstname;
    const lastname = info.lastname || existing.lastname;
    const city = info.city || existing.city;
    const picture = info.picture || existing.picture;

    const userUpdateQuery = `
      UPDATE users
      SET firstname = $1,
          lastname = $2,
          city = $3,
          picture = $4
      WHERE user_id = $5
    `;

    await pool.query(userUpdateQuery, [
      firstname,
      lastname,
      city,
      picture,
      user_id
    ]);

    // // Optional: only update student_alumni fields if present
    // if (info.bio || info.major || info.experience || info.graduation_year) {
    //   await pool.query(
    //     `UPDATE student_alumni
    //      SET
    //        bio = COALESCE($1, bio),
    //        graduation_year = COALESCE($2, graduation_year),
    //        major = COALESCE($3, major),
    //        experience = COALESCE($4, experience)
    //      WHERE student_alumni_id = $5`,
    //     [
    //       info.bio ?? null,
    //       info.graduation_year ?? null,
    //       info.major ?? null,
    //       info.experience ?? null,
    //       user_id
    //     ]
    //   );
    // }

    res.json({ success: true, message: "Profile updated successfully" });

  } catch (error) {
    console.error("Update Profile Info Error:", error);
    res.status(500).json({ success: false, error: "Server error during update" });
  }
});


// Delete a user
userRouter.delete("/delUser", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;

    const result = await pool.query("DELETE FROM users WHERE user_id = $1", [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("User deletion error:", error);
    res.status(500).json({ error: "Database query failed" });
  }
});

//update email and password only
userRouter.put("/updateCredentials", authenticateToken, async (req, res) => {
  const { user_id, email, oldPassword, newPassword } = req.body;

  try {
    const result = await pool.query("SELECT password FROM users WHERE user_id = $1", [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const currentHashedPassword = result.rows[0].password;
    const isMatch = await bcrypt.compare(oldPassword, currentHashedPassword);
    console.log("bcrypt isMatch result:", isMatch);  // 🔍 <== ADD THIS LINE

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect old password" });
    }

    // If password matched, hash new password and update it
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password = $1, email = $2 WHERE user_id = $3",
      [newHashedPassword, email, user_id]
    );

    res.json({ success: true, message: "Credentials updated successfully" });

  } catch (err) {
    console.error("Update credentials error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default userRouter;