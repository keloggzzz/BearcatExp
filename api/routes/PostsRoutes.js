import express from "express";
const postRouter = express.Router();
import pool from "./PoolConnection.js";

//get all posts in the database
postRouter.get("/posts", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from posts");
      res.json({ rows:result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });

    }
  });


  //get a post from the database based on the post_id. need to add to get the post based on "like" for the search function
postRouter.get("/getpost", async (req, res) => {
    try {
      var id1=req.query.post_id;
      console.log(id1);
      const result = await pool.query("select * from posts where post_id="+id1);
      console.log(result);
      res.json({rows:result.rows});
     
    } catch (error) {
      console.error("Query error:", error);
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