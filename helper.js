const getUserByEmail = (email, database) => {
  for (let user in database) {
    if (email === database[user].email) {
      return user; // this just returns the key!
    }
  }
  return false;
};

module.exports = {getUserByEmail};