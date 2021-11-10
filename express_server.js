const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const app = express();
const PORT = 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "555": {
    id: "555",
    email: "a@b.com",
    password: "c"
  }
};

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

const getUserByEmail = (email) => {
  for (let key in users) {
    if (email === users[key].email) {
      return users[key];
    }
  }
  return false;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = {user_id: req.cookies["user_id"],urls: urlDatabase, users};
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req,res) => {
  const templateVars = {user_id: req.cookies["user_id"], users};
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = {user_id: req.cookies["user_id"],shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], users};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.get("/register", (req,res) => {
  const templateVars = {user_id: req.cookies["user_id"], users};
  res.render("register_new", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {user_id: req.cookies["user_id"], users};
  res.render("login", templateVars);

});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  console.log(urlDatabase);
  res.redirect(`urls/${shortURL}`);
});


//can this be urls/:shortURLs??
app.post("/urls/:id", (req, res)=>{
  const shortURL = req.params.id;
  const newlongURL = req.body.newLongURL;
  urlDatabase[shortURL] = newlongURL;
  res.redirect('/urls');
});


app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const inputEmail = req.body.email;
  const inputPassword = req.body.password;
  const user = getUserByEmail(inputEmail);

  if (user) {
    if(user.password === inputPassword) {
      res.cookie("user_id", user);
      res.redirect("/urls");
    }
  } else {
    res.statusCode = 403;
    res.send(`${res.statusCode} Error! Invalid E-mail and/or password!`);
  }

});

app.post("/logout", (req,res) => {
  res.clearCookie("user_id", req.cookies["user_id"]);
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;

  if (email === "" || password === "") {
    res.statusCode = 400;
    res.send(`${res.statusCode} Error! Please input an email and/or password`);
    return;
  } else if (getUserByEmail(email)) {
    res.statusCode = 400;
    res.send(`${res.statusCode} Error! E-mail already exists`);
    return;
  }else{
    users[id] = {id, email, password};
    res.cookie("user_id", id);
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