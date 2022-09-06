const serverless = require('serverless-http');
const express = require("express");
const path = require('path');
const app = express();
let cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

let pdfRouter = require('./router/pfd')


app.use(cors());

// Body-parser middleware
app.use(express.urlencoded({
  extended: true
}))

// Json middleware
app.use(express.json());
// router Middleware
app.use(express.static(path.join(__dirname,'public')))
app.use('/', pdfRouter);

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});

app.post("/hello", (req, res, next) => {
  return res.status(200).json({
    message: req.body,
  });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

app.listen(PORT, () => {
  console.log(`Listening to the server on http://localhost:${PORT}`);
})

exports.handler = serverless(app);
