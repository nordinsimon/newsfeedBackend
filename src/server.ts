import app from "./app";

const port = process.env.PORT || "3000";

//Start our server
app.listen(port, () => {
  console.log("Server running on port 3000");
  console.log(`Origin set to ${process.env.ORIGIN}`);
});
