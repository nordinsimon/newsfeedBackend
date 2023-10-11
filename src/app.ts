import express from "express";
import logger from "./middleware/logger";

const app = express();

app.use(logger);

app.get("/", (_req, res) => {
  res.status(200).send({
    message: "Hello world",
  });
});

export default app;
