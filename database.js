const bcrypt = require('bcryptjs');

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
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password:  "dishwasher-funk"
  },
  "555": {
    id: "555",
    email: "a@b.com",
    password:  "c"
  }
};

users["userRandomID"].password = bcrypt.hashSync("purple-monkey-dinosaur", 10);
users["user2RandomID"].password = bcrypt.hashSync("dishwasher-funk", 10);
users["555"].password = bcrypt.hashSync("c",10);

module.exports = {urlDatabase, users};