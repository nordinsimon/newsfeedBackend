import { Request, Response, NextFunction } from "express";

const logger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(" ");
  console.log(`req: ${req.method}  ${req.url}`);
  console.log("         Authorization ", req.headers.authorization);
  console.log("         Body", req.body);
  console.log("         Query", req.query);
  console.log("         IP", req.ip);

  next();
};

export default logger;
