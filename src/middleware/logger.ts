import { Request, Response, NextFunction } from "express";

const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(" ");
  console.log(`req: ${req.method}  ${req.url}`);
  console.log("         Body", req.body);
  console.log("         Query", req.query);
  console.log("         IP", req.ip);

  console.log("res: ", res.statusCode);
  next();
};

export default logger;
