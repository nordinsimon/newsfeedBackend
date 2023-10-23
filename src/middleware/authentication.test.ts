import { test } from "vitest";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

test("should allow access for valid admin token", async ({ expect }) => {
  const token = ACCESS_TOKEN_SECRET;

  const res = await fetch("http://localhost:3000/api/news/access/create", {
    method: "GET",
    headers: {
      Cookie: `access_token=${token}`,
    },
  });
  const text = await res.text();

  expect(res.status).toBe(200);
  expect(text).toBe("Admin Content");
});

test.only("should deny access for invalid token", async ({ expect }) => {
  const res = await fetch("http://localhost:3000/api/news/access/create", {
    method: "GET",
    headers: {
      Cookie: "access_token=INVALID_TOKEN",
    },
  });

  expect(res.status).toBe(401);
});
