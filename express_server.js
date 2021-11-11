const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
// const cookieParser = require("cookie-parser");
// const salt = bcrypt.genSaltSync(10);
// const hash = bcrypt.hashSync("B4c0/\/", salt);
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["what is my password", "hello there world"]
}))
// app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  b6UTxQ: {
      longURL: "https://www.tsn.ca",
      userID: "aJ48lW"
  },
  i3BoGr: {
      longURL: "https://www.google.ca",
      userID: "userRandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password:  bcrypt.hashSync("dishwasher-funk", 10)
  },
  "555": {
    id: "555",
    email: "a@b.com",
    password:  bcrypt.hashSync("c",10)
  }
};


const urlsForUser = (id, database) => {
  // loop through the urlDatabase
  let personalURLs = {};
  for (let shortURL in database) {
    if (id === database[shortURL].userID) {
      personalURLs[shortURL] = database[shortURL]
    }
  }
  return personalURLs;
} 

const generateRandomString = () => {
  let randomString = (Math.random() + 1).toString(36).substring(2, 8);
  return randomString;
};

//checks if a user exists by their email
// const exisitingEmail = (email) => {
//   for (let user in users) {
//     if (email === users[user].email) {
//       return true;
//     }
//   }
//   return false;
// };

//return the object value of the user
const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (email === database[user].email) {
      return user; // this just returns the key!
    }
  }
  return false;
};

app.get("/", (req, res) => {
  if(!req.session.user_id) {
    const templateVars = {user_id: req.session.user_id, users};
    res.render("welcome", templateVars);
  }else{
    res.redirect("/urls");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const userID = req.session.user_id
  if(userID){
    const templateVars = {user_id: userID, urls: urlsForUser(userID, urlDatabase), users};
    res.render("urls_index", templateVars);
  }else{
    const messageOb = {message: "Please login to view URLs", user_id: req.session.user_id, users}
    res.render("error_login.ejs", messageOb)
  }
});

app.get("/urls/new", (req,res) => {
  const templateVars = {user_id: req.session.user_id, users};
  if(req.session.user_id) {
    res.render("urls_new", templateVars);
  }else{
    const messageOb = {message: "Please login to create new URLs", user_id: req.session.user_id, users}
    res.render("error_login.ejs", messageOb)
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const personalDb = urlsForUser(req.session.user_id, urlDatabase);
  const shortURL = req.params.shortURL;
  if(!req.session.user_id) {
    const loginMessage = {message: "Please login to view your URLs", user_id: req.session.user_id, users}
    res.render("error_login.ejs", loginMessage)
  }else if (personalDb[shortURL] === undefined) {
    const messageOb = {message: "Sorry, you do not have this URL", user_id: req.session.user_id, users}
    res.render("error_url.ejs", messageOb)
  }else{
    const longURL = personalDb[req.params.shortURL].longURL;
    const templateVars = {user_id: req.session.user_id,shortURL, longURL, users};
    res.render("urls_show", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  if(urlDatabase[req.params.shortURL] !== undefined){
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }else{
    const messageOb = {message: "Sorry, URL does not exist", user_id: req.session.user_id, users}
    res.render("error_url.ejs", messageOb)
  }
});

app.get("/register", (req,res) => {
  const templateVars = {user_id: req.session.user_id, users};
  res.render("register_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {user_id: req.session.user_id, users};
  res.render("login", templateVars);

});

app.get("/*", (req, res) => {
  res.redirect("/");
})

app.post("/urls", (req, res) => {
  // now I need to add the URL into the personal database
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  
  if(req.session.user_id) {
    urlDatabase[shortURL] = {longURL, userID:req.session.user_id};
    res.redirect(`urls/${shortURL}`);
  } else {
    res.status(418).send("Only Teapots can brew tea!")
  }

});


//can this be urls/:shortURLs??
app.post("/urls/:id", (req, res)=>{
  const shortURL = req.params.id;
  const newlongURL = req.body.newLongURL;
  const editURLUserId = urlDatabase[req.params.id].userID;
  if(req.session.user_id === editURLUserId) {
    urlDatabase[shortURL].longURL = newlongURL;
    res.redirect('/urls');
  }
  res.status(418).send("Teapots can't brew coffee!")
});


app.post("/urls/:shortURL/delete", (req, res) => {
  //if I am the user, then only I can delete from the masterDB
  const deleteURLUserId = urlDatabase[req.params.shortURL].userID;
  if(req.session.user_id === deleteURLUserId){
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  }
  res.status(418).send("Don't throw out my tea!")
});

app.post("/login", (req, res) => {
  const testEmail = req.body.email;
  const testPassword = req.body.password;
  const user = getUserByEmail(testEmail, users);
  // users object's key
  // console.log(user)
  
  if (!users[user]) {
    return res.status(404).send("Error! No user with the email found!");
  }
  
  const comparePass = bcrypt.compareSync(testPassword, users[user].password);
  if(comparePass) {
      // res.cookie("user_id", user.id);
      req.session.user_id = users[user].id

      res.redirect("/urls");
  } else {
    return res.status(404).send("Error! Invalid password! Please try again.")
  }
});

app.post("/logout", (req,res) => {
  // res.clearCookie("user_id", req.cookies["user_id"]);
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (email === "" || password === "") {
    res.statusCode = 400;
    res.send(`${res.statusCode} Error! Please input an email and/or password`);
    return;
  } else if (getUserByEmail(email, users)) {
    res.statusCode = 400;
    res.send(`${res.statusCode} Error! E-mail already exists`);
    return;
  }else{
    users[id] = {id, email, password: hashedPassword};
    // res.cookie("user_id", id);
    req.session.user_id = id;
    res.redirect("/urls");
  }
});


// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
// });

// app.get("/fetch", (req, res) => {
//   res.send(`a = ${a}`);
// });

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});