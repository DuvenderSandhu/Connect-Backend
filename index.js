// Import
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Declearation

const JWT_SECRET = "Connect_@DSANDHU";
const connectToMongo = async function () {
  try {
    let result = await mongoose.connect("mongodb://127.0.0.1:27017/Connect");
    return "connected";
  } catch {
    return { alert: "Internal Server Error" };
  }
};
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  info: Object,
});
const msgSchema = new mongoose.Schema({
  between: Array,
  msg: String,
});
const User = mongoose.model("Users", UserSchema);
const Msg = mongoose.model("Messages", msgSchema);
mongoose.set("strictQuery", false);
const app = express();
app.use(express.json());

// Routes

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.get("/my-profile", async (req, res) => {
  let user = jwt.verify(req.body.token, JWT_SECRET);
  if (user) {
    let result = connectToMongo();
    let my_data = await User.find({ username: user.username });
    res.send(my_data);
  } else {
    res.json({ alert: "Invalid URL" });
  }
});

app.get("/search", (req, res) => {
  res.send("Search");
});

app.get("/search/:query", async (req, res) => {
  if (req.body.token) {
    if (req.params.query) {
      let result = connectToMongo();
      if (result.alert) {
        res.json(result);
      } else {
        let searched = await User.find({ username: req.params.query });
        res.json(searched);
      }
    } else {
      res.send("Search Here");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/request/:username", async (req, res) => {
  try {
    let user = jwt.verify(req.body.token, JWT_SECRET);
    let result = await connectToMongo();
    let requested_user = await User.find({
      username: req.params.username,
    }).select(["-password", "-email"]);
    let my_data = await User.find({ username: user.username }).select([
      "-password",
      "-email",
    ]);
    if (
      requested_user.length != 0 &&
      requested_user[0].info.req.indexOf(user.username) < 0 &&
      my_data[0].info.req.indexOf(requested_user[0].username) < 0 &&
      requested_user[0].info.friends.indexOf(user.username) < 0 &&
      requested_user[0].username != user.username
    ) {
      requested_user[0].info.req.push(user.username);
      await User.updateOne(
        { username: requested_user[0].username },
        {
          $set: {
            info: {
              req: requested_user[0].info.req,
              friends: requested_user[0].info.friends,
            },
          },
        }
      );
      let new_user = await User.find({ username: requested_user[0].username });
      res.json(new_user);
    } else if (
      requested_user[0].username === user.username ||
      my_data[0].info.req.indexOf(requested_user[0].username) >= 0 ||
      requested_user[0].info.req.indexOf(user.username) >= 0 ||
      requested_user[0].info.friends.indexOf(user.username) >= 0
    ) {
      res.send(requested_user[0]);
    } else {
      res.json({ alert: "User not found" });
    }
  } catch {
    res.json({ alert: "Something went wrong" });
  }
});

app.post("/accept/:username", async (req, res) => {
  // TODO: Inserting null into friends and not removing Requests
  try {
    let user = jwt.verify(req.body.token, JWT_SECRET);
    let result = await connectToMongo();
    let my_data = await User.find({ username: user.username }).select([
      "-password",
      "-email",
    ]);
    if (
      my_data[0].info.req.indexOf(req.params.username) >= 0 &&
      my_data[0].info.friends.indexOf(req.params.username) < 0
    ) {
      let requested_user = await User.find({
        username: req.params.username,
      }).select(["-password", "-email"]);
      my_data[0].info.req.pop(user.username);
      requested_user[0].info.friends.push(user.username);
      my_data[0].info.friends.push(requested_user[0].username);
      await User.updateOne(
        { username: requested_user[0].username },
        {
          $set: {
            info: {
              req: requested_user[0].info.req,
              friends: requested_user[0].info.friends,
            },
          },
        }
      );
      await User.updateOne(
        { username: user.username },
        {
          $set: {
            info: {
              req: my_data[0].info.req,
              friends: my_data[0].info.friends,
            },
          },
        }
      );
      let new_user = await User.find({ username: user.username }).select([
        "-password",
        "-email",
      ]);
      res.json(new_user);
    } else {
      res.json({ alert: "Invalid URL" });
    }
  } catch {
    res.json({ alert: "Something went wrong" });
  }
});

app.post("/chat/:username", async (req, res) => {
  try {
    let result = await connectToMongo();
    let user = await jwt.verify(req.body.token, JWT_SECRET);
    if (user) {
      let my_data = await User.find({ username: user.username }).select([
        "-password",
        "-email",
      ]);
      if (my_data[0].info.friends.length === 0) {
        res.send("You Have No Friends");
      } else if (my_data[0].info.friends.indexOf(req.params.username) >= 0) {
        let chat = await Msg.find({$or:[{between: [
          user.username.toLowerCase(),
          req.params.username.toLowerCase(),
        ]},{between: [
          req.params.username.toLowerCase(),
          user.username.toLowerCase(),
        ],}]});
        if (req.body.message) {
          let obj= await Msg.create({
            between: [
              user.username.toLowerCase(),
              req.params.username.toLowerCase(),
            ],
            msg: req.body.message,
          });
          let chat = await Msg.find({
            between: [
              user.username.toLowerCase(),
              req.params.username.toLowerCase(),
            ],

          });
          res.send(chat)
        }
      
        else if (chat.length === 0) {
          if (req.body.message) {
            let obj= await Msg.create({
              between: [
                user.username.toLowerCase(),
                req.params.username.toLowerCase(),
              ],
              msg: req.body.message,
            });
            let chat = await Msg.find({
              between: [
                user.username.toLowerCase(),
                req.params.username.toLowerCase(),
              ],

            });
            res.send(chat)
          } else {
            res.json({ alert: "No Chat Found" });
            // res.send(chat);
          }
        } else {
          res.json(chat);
        }
      } 
      else {
        res.send("Something Went Wrong");
      }
    }
  } catch {
    res.send("Something Went Wrong");
  }
});

app.get("/signup", async (req, res) => {
  res.send("SIgnup Get");
});
app.get("/login", (req, res) => {
  res.json({ requirement: "Login GET" });
});

app.post("/signup", async (req, res) => {
  let result = await connectToMongo();
  if (result.alert) {
    res.send(result);
  } else {
    let users = await User.find({
      $or: [
        { email: req.body.email.toLowerCase() },
        { username: req.body.username.toLowerCase() },
      ],
    });
    if (users.length != 0) {
      res.json({ alert: "User Already Exist with same Details" });
    } else {
      let user = await User.create({
        username: req.body.username,
        email: req.body.email,
        password: await bcrypt.hash(
          req.body.password,
          await bcrypt.genSalt(10)
        ),
        info: { req_no: 0, friends_no: 0, req: [], friends: [] },
      });
      res.send(user);
    }
  }
});

app.post("/login", async (req, res) => {
  let result = await connectToMongo();
  if (result.alert) {
    res.send(result);
  } else {
    let users = await User.find({
      $or: [{ username: req.body.username.toLowerCase() }],
    });
    if (users.length != 0) {
      if (await bcrypt.compare(req.body.password, users[0].password)) {
        let payload = {
          username: users[0].username,
          email: users[0].email,
        };
        let token = jwt.sign(payload, JWT_SECRET);
        res.json({ token: token });
      } else {
        res.json({ alert: "Invalid Credentials" });
      }
    } else {
      res.json({ alert: "Invalid Credentials" });
    }
  }
});

app.listen(80, () => {
  console.log(`http://localhost`);
});
