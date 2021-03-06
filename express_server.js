const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const {urlDatabase, users} = require('./database');
const {getUserByEmail, urlsForUser, generateRandomString} = require('./helpers');

const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

// MIDDLEWARE
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["what is my password", "hello there world"]
}));

// GET ROUTES

app.get("/", (req, res) => {
  const userID = req.session.user_id;
  // Checking if a user is logged in. If logged in, redirect to URL page. If not, redirect to login page.
  if (userID) {
    return res.redirect("/urls");
  }
  return res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  // Checking if user logged in. If logged in, render to URLs page.
  if (userID) {
    const templateVars = {users, user_id: userID, urls: urlsForUser(userID, urlDatabase)};
    return res.render("urls_index", templateVars);
  }
  // If not logged in, set error status and render error page.
  const messageOb = {message: "Please login to view URLs", user_id: req.session.user_id, users};
  res.status(404);
  return res.render("error_login.ejs", messageOb);
});

app.get("/urls/new", (req,res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};

  // Checking if user logged in. If logged in, render to 'create new link' page.
  if (userID) {
    return res.render("urls_new", templateVars);
  }
  // If not logged in, redirect to login page.
  return res.redirect("/login");
});

app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.user_id;
  // Getting a database with only URLs owned by user.
  const personalDb = urlsForUser(userID, urlDatabase);
  const shortURL = req.params.shortURL;

  // Checking if user not logged in or if the URL belongs to the another user.
  if (!userID) {
    const loginMessage = {users, message: "Please login to view your URLs", user_id: userID};
    return res.render("error_login.ejs", loginMessage);
  } else if (personalDb[shortURL] === undefined) {
    const messageOb = {users, message: "Sorry, you do not have this URL", user_id: userID};
    return res.render("error_url.ejs", messageOb);
  } else {
    // All good. Render to page that shows user's URLs.
    const longURL = personalDb[req.params.shortURL].longURL;
    const templateVars = {shortURL, longURL, users, user_id: userID};
    return res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  // Checks if URL for given id exists. If so, redirect to longURL page.
  if (urlDatabase[req.params.shortURL] !== undefined) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    return res.redirect(longURL);
  }

  // If URL for given id does not exists, set error code and render to error page.
  const messageOb = {message: "Sorry, URL does not exist", user_id: req.session.user_id, users};
  res.status(404);
  return res.render("error_url.ejs", messageOb);
});

app.get("/register", (req,res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};
  
  // Checks if a user is logged in. If so, redirect to URL page. If not, display registration page.
  if (userID) {
    return res.redirect('/urls');
  }
  return res.render("register_new", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const templateVars = {users, user_id: userID};

  // Checks if a user is logged in. If so, redirect to URL page. If not, display login page.
  if (userID) {
    return res.redirect('/urls');
  }
  return res.render("login", templateVars);
});

app.get("/*", (req, res) => {
  return res.redirect("/");
});


// POST ROUTES

//POST URLs: route activated when user clicks the "submit" button when creating new url.
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  
  // Checks if user is logged in. If so, redirect to specific shortURL page.
  if (userID) {
    urlDatabase[shortURL] = {longURL, userID};
    return res.redirect(`/urls/${shortURL}`);
  }
  // If not logged in, set error code and send error message.
  return res.status(418).send("Only Teapots can brew tea!");
});

app.post("/urls/:id", (req, res)=>{
  const shortURL = req.params.id;
  const newlongURL = req.body.newLongURL;
  const editURLUserId = urlDatabase[req.params.id].userID;
  const userID = req.session.user_id;

  // Checks if the user trying to change the URL is the owner of the URL. If so, update longURL, redirect to URL page.
  if (userID === editURLUserId) {
    urlDatabase[shortURL].longURL = newlongURL;
    return res.redirect('/urls');
  }
  // If not logged in or is another user, set error code and send error message.
  return res.status(418).send("Teapots can't brew coffee!");
});


// POST Delete: front end - route activated when 'delete' button is clicked.
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session.user_id;
  const deleteURLUserId = urlDatabase[req.params.shortURL].userID;

  // Checking if the user trying to change the URL owns the URL. If so, delete, and redirect to URL page.
  if (userID === deleteURLUserId) {
    delete urlDatabase[req.params.shortURL];
    return res.redirect("/urls");
  // If another user is logged in or if no one is logged in, set error status, send error message
  } else if (userID) {
    return res.status(418).send("Don't throw out my tea!");
  } else {
    return res.status(401).send("Please login to delete your items!");
  }
});

// POST Login: route activated when 'login' button is clicked.
app.post("/login", (req, res) => {
  const testEmail = req.body.email;
  const testPassword = req.body.password;
  const user = getUserByEmail(testEmail, users);
  
  // Checking if the email or password are empty or if an email is not in our database.
  if (!testEmail || !testPassword) {
    return res.status(404).send('Error! Please enter an email address and/or password! Please try to <a href="/login">login</a> again.');
  } else if (!users[user]) {
    return res.status(404).send('Error! No user with the email found! Please try to <a href="/login">login</a> again.');
  }
  
  const comparePass = bcrypt.compareSync(testPassword, users[user].password);
  // Compares if the hashed password of the inputted password matches the one in our database.
  if (comparePass) {
    // If matches, set cookie session, redirect to URLs page.
    req.session.user_id = users[user].id;
    return res.redirect("/urls");
  } else {
    // If not, set error status and send error message.
    return res.status(404).send('Error! Invalid password! Please try to <a href="/login">login</a> again.');
  }
});

// POST Logout: route activated when user clicks 'logout' button.  Cookie session cleared.
app.post("/logout", (req,res) => {
  req.session = null;
  return res.redirect("/urls");
});

//POST Register: route activated when user clicks 'register' button.
app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  // Hashing the password prior to saving to the database.
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Checking if the email or password are empty or if an email already exists.
  if (!email || !password) {
    return res.status(401).send('Error! Please input an email and/or password. Please try to <a href="/register">register</a> again.');
  } else if (getUserByEmail(email, users)) {
    return res.status(401).send('Error! E-mail already exists. Please use different email to <a href="/register">register</a>.');
  } else {
    // Resigration successful: create a new user, save to database, create cookie session, redirect to URL page.
    const user = {id, email, password: hashedPassword};
    users[id] = user;
    req.session.user_id = id;
    return res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});