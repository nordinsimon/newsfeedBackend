import { Request, Response, NextFunction } from "express";

const logger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(" ");
  console.log(`req: ${req.method}  ${req.url}`);
  console.log("         Body", req.body);
  console.log("         Query", req.query);
  next();
};

export default logger;
