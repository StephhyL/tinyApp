const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (email === database[user].email) {
      return user; // this just returns the key!
    }
  }
  return false;
};

const urlsForUser = (id, database) => {
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

module.exports = {getUserByEmail, urlsForUser, generateRandomString};