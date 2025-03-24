import express from "express";
const postRouter = express.Router();
import pool from "./PoolConnection.js";

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


  



  //delete a post based on id. stuAlu can only delete their own posts. org members who are admin can delete org posts
  postRouter.get("/delpost", async (req, res)=> {
    try{
      var id1= req.query.post_id;
      console.log(id1);
    const result = await pool.query("Delete post from posts where post_id = "+id1);
    console.log(result);
    res.json({ans: 1});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: 0});
    }
  })



// change from books to posts....also, how to add a post auto linking it to the user's id from login...

//   postRouter.get("/addpost", async (req, res) => {
//     try {

//         var title="Coding Journal";
//         var author="Jimmy John";
//         var price=90.98;
//         var catid=5;
//         var qry="Insert into books (title, author, price, category_id) VALUES ("
//         + "'"+title+"',"
//         + "'"+author+"',"
//         +price+","
//         +catid+")";

//         console.log(qry);

//       const result = await pool.query(qry);
//       console.log(result);
//       res.json({ans: 1});
     
//     } catch (error) {
//       console.error("Query error:", error);
//       res.status(500).json({ error: "Database query failed" });     
//     }
//   });

export default postRouter;