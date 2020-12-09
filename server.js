const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Database
const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let exerciseSessionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String,
});

let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSessionSchema],
});

let Session = mongoose.model("Session", exerciseSessionSchema);
let User = mongoose.model("User", userSchema);

//Routes

app.post(
  "/api/exercise/new-user",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let newUser = new User({ username: req.body.username });
    newUser.save((err, savedUser) => {
      if (!err) {
        let responseObject = {};
        responseObject.username = savedUser.username;
        responseObject._id = savedUser.id;
        res.json(responseObject);
      }
    });
  }
);

app.get("/api/exercise/users", (req, res) => {
  User.find({}, (err, arrayOfUsers) => {
    if (!err) {
      res.json({ arrayOfUsers });
    }
  });
});

app.post(
  "/api/exercise/add",
  bodyParser.urlencoded({ extended: false }),
  (req, res) => {
    let newSession = new Session({
      description: req.body.description,
      duration: parseInt(req.body.duration),
      date: req.body.date, // req.body.date === '' ? new Date().toISOString().substring(0,10) : req.body.date
    });

    if (newSession.date === "") {
      newSession.date = new Date().toISOString().substring(0, 10);
    }

    User.findByIdAndUpdate(
      req.body.userId,
      { $push: { log: newSession } },
      { new: true },
      (err, updatedUser) => {
        if (!err) {
          let responseObject = {};
          responseObject._id = updatedUser.id;
          responseObject.username = updatedUser.username;
          responseObject.date = new Date(newSession.date).toDateString();
          responseObject.description = newSession.description;
          responseObject.duration = newSession.duration;
          res.json(responseObject);
        }
      }
    );
  }
);

//Listener
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
