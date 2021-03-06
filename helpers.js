const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (email === database[user].email) {
      return user;
    }
  }
  return undefined;
};

/**
returns an object of all the URLs created by the specific user
 */
const urlsForUser = (id, database) => {
  let personalURLs = {};
  for (let shortURL in database) {
    if (id === database[shortURL].userID) {
      personalURLs[shortURL] = database[shortURL];
    }
  }
  return personalURLs;
};

const generateRandomString = () => {
  const randomString = (Math.random() + 1).toString(36).substring(2, 8);
  return randomString;
};

module.exports = {getUserByEmail, urlsForUser, generateRandomString};