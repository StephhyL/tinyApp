const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const {urlDatabase, users} = require('./database');
const {getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["what is my password", "hello there world"]
}));
app.set("view engine", "ejs");

// GET routes
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (userID) {
    const templateVars = {users, user_id: userID, urls: urlsForUser(userID, urlDatabase)};
    res.render("urls_index", templateVars);
  } else {
    const messageOb = {message: "Please login to view URLs", user_id: req.session.user_id, users};
    res.render("error_login.ejs", messageOb);
  }
});

app.get("/urls/new", (req,res) => {
  const templateVars = {users, user_id: req.session.user_id};

  if (req.session.user_id) {
    res.render("urls_new", templateVars);
  } else {
    const messageOb = {message: "Please login to create new URLs", user_id: req.session.user_id, users};
    res.render("error_login.ejs", messageOb);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const personalDb = urlsForUser(req.session.user_id, urlDatabase);
  const shortURL = req.params.shortURL;

  if (!req.session.user_id) {
    const loginMessage = {message: "Please login to view your URLs", user_id: req.session.user_id, users};
    res.render("error_login.ejs", loginMessage);
  } else if (personalDb[shortURL] === undefined) {
    const messageOb = {message: "Sorry, you do not have this URL", user_id: req.session.user_id, users};
    res.render("error_url.ejs", messageOb);
  } else {
    const longURL = personalDb[req.params.shortURL].longURL;
    const templateVars = {longURL, users, user_id: req.session.user_id,shortURL};
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    const messageOb = {message: "Sorry, URL does not exist", user_id: req.session.user_id, users};
    res.render("error_url.ejs", messageOb);
  }
});

app.get("/register", (req,res) => {
  const templateVars = {users, user_id: req.session.user_id};

  res.render("register_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {users, user_id: req.session.user_id};

  res.render("login", templateVars);
});

app.get("/*", (req, res) => {
  res.redirect("/");
});

//POST routes
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  if (req.session.user_id) {
    urlDatabase[shortURL] = {longURL, userID:req.session.user_id};
    res.redirect(`urls/${shortURL}`);
  } else {
    res.status(418).send("Only Teapots can brew tea!");
  }

});


app.post("/urls/:id", (req, res)=>{
  const shortURL = req.params.id;
  const newlongURL = req.body.newLongURL;
  const editURLUserId = urlDatabase[req.params.id].userID;

  if (req.session.user_id === editURLUserId) {
    urlDatabase[shortURL].longURL = newlongURL;
    res.redirect('/urls');
  } else {
    res.status(418).send("Teapots can't brew coffee!");
  }
});


app.post("/urls/:shortURL/delete", (req, res) => {
  const deleteURLUserId = urlDatabase[req.params.shortURL].userID;

  if (req.session.user_id === deleteURLUserId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else if (req.session.user_id) {
    res.status(418).send("Don't throw out my tea!");
  } else {
    res.status(401).send("Please login to delete your items!");
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
    res.redirect("/urls");
  } else {
    return res.status(404).send("Error! Invalid password! Please try again.");
  }
});

app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    res.status(401).send(`Error! Please input an email and/or password`);
  } else if (getUserByEmail(email, users)) {
    res.status(401).send(`Error! E-mail already exists`);
  } else {
    users[id] = {id, email, password: hashedPassword};
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});