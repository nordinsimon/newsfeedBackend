import express from "express";
import checkUserRole from "./path-to-your-middleware";
import request from "vitest";

const app = express();

app.use(express.json());
app.use(cookieParser()); // If you're using cookie-parser to handle cookies.

app.get("/admin-endpoint", checkUserRole("admin"), (req, res) => {
  res.status(200).send("Admin Content");
});

test("should allow access for valid admin token", async () => {
  const token = YOUR_FUNCTION_TO_GENERATE_ADMIN_TOKEN();
  const res = await request(app)
    .get("/admin-endpoint")
    .set("Cookie", [`access_token=${token}`]);

  expect(res.statusCode).toBe(200);
  expect(res.text).toBe("Admin Content");
});
