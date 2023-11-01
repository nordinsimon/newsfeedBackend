import request from "supertest";
import app from "../app";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateTestToken = (userId: string, role: string) => {
  const payload = {
    userId,
    role,
  };

  const secret = process.env.ACCESS_TOKEN_SECRET as string;

  const token = jwt.sign(payload, secret, {
    expiresIn: "1h",
  });
  return token;
};

const testToken = generateTestToken("testUserId", "admin");

describe("POST /api/identity/invite", () => {
  it("should return 200 and an email sent message", async () => {
    const response = await request(app)
      .post("/api/identity/invite")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ email: "test@example.com", name: "TestUser" });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Email sent");
  });
});

describe("POST /api/identity/login", () => {
  it("should return 200 and a token", async () => {
    const response = await request(app).post("/api/identity/login").send({
      email: "oscar.simon11111@gmail.com",
      password: "secretPassword",
    });
    console.log(response.body);
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});

/* 

describe("App", () => {
  it("should always pass", () => {
    expect(true).toBe(true);
  });
});
 */
