const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const {urlDatabase, users} = require('./database');
const {getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["what is my password", "hello there world"]
}));

// GET routes
app.get("/", (req, res) => {
  const userID = req.session.user_id;
  if (userID) {
    return res.redirect("/urls");
  } 

  return res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    const templateVars = {users, user_id: userID, urls: urlsForUser(userID, urlDatabase)};
    return res.render("urls_index", templateVars);
  } else {
    const messageOb = {message: "Please login to view URLs", user_id: req.session.user_id, users};
    res.status(404);
    return res.render("error_login.ejs", messageOb);
  }
});

app.get("/urls/new", (req,res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};

  if (userID) {
    return res.render("urls_new", templateVars);
  } else {
    const messageOb = {users, message: "Please login to create new URLs", user_id: userID};
    res.status(404);
    return res.render("error_login.ejs", messageOb);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  const personalDb = urlsForUser(userID, urlDatabase);
  const shortURL = req.params.shortURL;

  if (!userID) {
    const loginMessage = {users, message: "Please login to view your URLs", user_id: userID};
    return res.render("error_login.ejs", loginMessage);
  } else if (personalDb[shortURL] === undefined) {
    const messageOb = {users, message: "Sorry, you do not have this URL", user_id: userID};
    return res.render("error_url.ejs", messageOb);
  } else {
    const longURL = personalDb[req.params.shortURL].longURL;
    const templateVars = {shortURL, longURL, users, user_id: userID};
    return res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  } else {
    const messageOb = {message: "Sorry, URL does not exist", user_id: req.session.user_id, users};
    res.status(404);
    return res.render("error_url.ejs", messageOb);
  }
});

app.get("/register", (req,res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    return res.render("register_new", templateVars);
  }
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};
  if (req.session.user_id) {
    return res.redirect('/urls');
  } else {
    return res.render("login", templateVars);
  }
});

app.get("/*", (req, res) => {
  return res.redirect("/");
});

//POST routes
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  
  if (userID) {
    urlDatabase[shortURL] = {longURL, userID};
    return res.redirect(`urls/${shortURL}`);
  } else {
    return res.status(418).send("Only Teapots can brew tea!");
  }
});

app.post("/urls/:id", (req, res)=>{
  const shortURL = req.params.id;
  const newlongURL = req.body.newLongURL;
  const editURLUserId = urlDatabase[req.params.id].userID;
  const userID = req.session.user_id;

  if (userID === editURLUserId) {
    urlDatabase[shortURL].longURL = newlongURL;
    return res.redirect('/urls');
  } else {
    return res.status(418).send("Teapots can't brew coffee!");
  }
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const deleteURLUserId = urlDatabase[req.params.shortURL].userID;

  if (userID === deleteURLUserId) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  } else if (userID) {
    return res.status(418).send("Don't throw out my tea!");
  } else {
    return res.status(401).send("Please login to delete your items!");
  }
});

app.post("/login", (req, res) => {
  const testEmail = req.body.email;
  const testPassword = req.body.password;
  const user = getUserByEmail(testEmail, users);
  
  if (testEmail === "" || testPassword === "") {
    return res.status(404).send("Error! Please enter an email address and/or password!");
  } else if (!users[user]) {
    return res.status(404).send("Error! No user with the email found!");
  }
  
  const comparePass = bcrypt.compareSync(testPassword, users[user].password);
  
  if (comparePass) {
    req.session.user_id = users[user].id;
    return res.redirect("/urls");
  } else {
    return res.status(404).send("Error! Invalid password! Please try again.");
  }
});

app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});

//POST Register, when the user submits the register button, this route is activated.
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  //hashing the password to encrypt it before saving to the db
  const hashedPassword = bcrypt.hashSync(password, 10);

  //checking for the validations if the email or password are empty or Email is already existing.
  if (!email|| !password) {
    return res.status(401).send(`Error! Please input an email and/or password.`);
  } else if (getUserByEmail(email, users)) {
    return res.status(401).send(`Error! E-mail already exists.`);
  } else {
    //everything looks ok. Create a new User, save to the DB and create the Session and redirect to the URLS
    const user = {id, email, password: hashedPassword};
    users[id] = user;
    req.session.user_id = id;
    return res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});