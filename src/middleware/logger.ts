import { Request, Response, NextFunction } from "express";

const logger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`req: ${req.method}  ${req.url}    Body:`, req.body);
  next();
};

export default logger;
