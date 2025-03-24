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
userRouter.get("/users", async (req, res) => {
    try {
      const result = await pool.query("SELECT * from users");
      res.json({ rows:result.rows });
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
        SELECT u.*, sa.graduation_year, sa.major, sa.bio
        FROM users u
        LEFT JOIN student_alumni sa ON u.user_id = sa.student_alumni_id
        WHERE u.user_id = $1
      `, [id]);
  
      res.json({ rows: result.rows });
    } catch (error) {
      console.error("Query error:", error);
      res.status(500).json({ error: "Database query failed" });
    }
  });
  

  //the logged in user can delete their profile
  userRouter.get("/deluser", async (req, res)=> {
    try{
      var id1= req.query.user_id;
      console.log(id1);
    const result = await pool.query("Delete user from users where user_id = "+id1);
    console.log(result);
    res.json({ans: 1});

    }catch(error){
      console.error("Query error: ", error);
      res.json({ans: 0});
    }
  })



// change from books to users....

//   userRouter.get("/addpost", async (req, res) => {
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

export default userRouter;