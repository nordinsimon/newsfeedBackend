import express from "express";
//import { pool } from "../config/mysqlConfig";

const router = express.Router();

/* 
/getAll
/create
/edit
/delete
*/

router.get("/getAll", async (_req, res) => {
  res.send("Get all news");
});
/* 
router.get("/access/create", async (_req, res) => {
  res.send("As admin you can access create news");
}); */

router.post("/create", async (_req, res) => {
  res.send("Create news");
});

router.put("/edit", async (_req, res) => {
  res.send("Edit news");
});

router.delete("/delete", async (_req, res) => {
  res.send("Delete news");
});

export default router;
