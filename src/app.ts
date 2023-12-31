import express from "express";
import cors from "cors";
import logger from "./middleware/logger";

import routerReCreateDB from "./routes/reCreateDB";
import routerIdentity from "./routes/routesIdentity";
import routerUsers from "./routes/routesUsers";
import routerNews from "./routes/routesNews";

const app = express();

app.use(express.json());
app.use(logger);
app.use(cors());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/api/routerReCreateDB", routerReCreateDB);
app.use("/api/identity", routerIdentity);
app.use("/api/users", routerUsers);
app.use("/api/news", routerNews);

app.get("/", (_req, res) => {
  res.status(200).send({
    message: "Hello world!",
  });
});

export default app;
