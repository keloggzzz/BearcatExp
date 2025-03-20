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



// change from books to organization_member....also, how to add a member having validated that the person is a member of a current org.

//   orgMemberRouter.get("/addpost", async (req, res) => {
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

export default orgMemberRouter;