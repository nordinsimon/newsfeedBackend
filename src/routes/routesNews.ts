import express, { Request, Response } from "express";
import {
  authenticateAdmin,
  authenticateUser,
} from "../middleware/authentication";
//import { pool } from "../config/mysqlConfig";

const router = express.Router();

/* 
/getAll
/create
/edit
/delete
*/

router.get(
  "/getAll",
  [authenticateUser],
  async (_req: Request, res: Response) => {
    res.send("Get all news");
  }
);

router.post(
  "/create",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Create news");
  }
);

router.put(
  "/edit",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Edit news");
  }
);

router.delete(
  "/delete",
  [authenticateAdmin],
  async (_req: Request, res: Response) => {
    res.send("Delete news");
  }
);

export default router;
