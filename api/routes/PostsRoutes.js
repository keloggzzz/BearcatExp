import express from "express";
const postRouter = express.Router();
import pool from "./PoolConnection.js";


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

//get all posts in the database
postRouter.get("/posts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        posts.*, 
        users.firstName AS "firstName", 
        users.lastName AS "lastName", 
        users.user_type, 
        organization.name AS organization_name
      FROM posts
      JOIN users ON posts.user_id = users.user_id
      LEFT JOIN organization ON posts.organization_id = organization.organization_id
      ORDER BY RANDOM()
    `);

    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Query error:", error.message, error.stack);
    res.status(500).json({ error: "Database query failed" });
  }
});




  //get post by id- for home page user side bar
  postRouter.get("/getPostByID", async (req, res) => {
    try {
      const id = req.query.post_id;
      console.log("Fetching post ID:", id);
  
      const query = `
  SELECT posts.*, 
         u.firstName AS "firstName", 
         u.lastName AS "lastName", 
         u.user_type, 
         org.name AS organization_name
  FROM posts
  JOIN users u ON posts.user_id = u.user_id
  LEFT JOIN organization org ON posts.organization_id = org.organization_id
  WHERE posts.post_id = $1
`;

  
      const result = await pool.query(query, [id]);
      res.json({ rows: result.rows });
    } catch (error) {
      console.error("Query error:", error.message, error.stack);
      res.status(500).json({ error: "Database query failed" });
    }
  });
  


//search all
postRouter.get("/searchPosts", async (req, res) => {
  try {
    const searchTerm = req.query.q;
    console.log("Search term:", searchTerm);

    const query = `
      SELECT posts.*, 
             u.firstName AS "firstName", 
             u.lastName AS "lastName", 
             u.user_type, 
             org.name AS organization_name
      FROM posts
      JOIN users u ON posts.user_id = u.user_id
      LEFT JOIN organization org ON posts.organization_id = org.organization_id
      WHERE 
        posts.content ILIKE $1 OR
        org.name ILIKE $1 OR
        u.firstName ILIKE $1 OR
        u.lastName ILIKE $1
    `;

    const result = await pool.query(query, [`%${searchTerm}%`]);
    res.json({ rows: result.rows });
  } catch (error) {
    console.error("Query error:", error.message, error.stack);
    res.status(500).json({ error: "Database query failed" });
  }
});

postRouter.post("/addPost", upload.single("postimg"), async (req, res) => {
  console.log("Add Post API called!");
  try {
      const {user_id, content, post_type, organization_id, title} = req.body;
      console.log({post_type});
      const postimg = req.file ? req.file.filename : null; // Handle image

      const query = `
        INSERT INTO posts (user_id, content, post_type, organization_id, title, postimg, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *;
    `;

    const { rows } = await pool.query(query, [user_id, content, post_type, organization_id, title, postimg]);

    res.status(201).json({ success: true, message: "User registered successfully", post: rows[0] });
  } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });
  }
});

  



  //delete a post based on id. stuAlu can only delete their own posts. org members who are admin can delete org posts
  postRouter.delete("/delpost", async (req, res)=> {
    try{
      const { post_id } = req.body;  // Use req.body to get the post_id, more common for delete methods
        console.log("Deleting Post ID: ", post_id);

        const result = await pool.query("Delete post from posts where post_id = "+post_id);
        console.log(result);
        res.json({ans: "Success"});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: "Failure"});
    }
  });

  postRouter.get("/getUserPosts", async (req, res) => {
    const { user_id } = req.query;  // Get the user_id from query parameters
    
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }
  
    try {
      const query = `
        SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC;
      `;
  
      // Execute the query with the user_id parameter
      const { rows } = await pool.query(query, [user_id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: "No posts found for this user" });
      }
  
      // Send the posts as the response
      res.json({ posts: rows });
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  export default postRouter;
