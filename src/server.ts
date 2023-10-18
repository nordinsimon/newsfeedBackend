import app from "./app";

const port = process.env.PORT || "3000";

//Start our server
app.listen(port, () => {
  console.log(`Origin set to ${port}`);
});
