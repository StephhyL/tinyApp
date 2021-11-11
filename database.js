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

module.exports = {urlDatabase};