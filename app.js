const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

let db = null;

const initializationDbAndServer = async () => {
  try {
    const db = open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at https://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
  }
};

initializationDbAndServer();

const validatePassword = (password) => {
  return password.length > 4;
};

//API 1
app.post("/register", async (request, respond) => {
  const { username, name, password, gender, location } = request.body;
  const hashPassword = bcrypt.hash(password, 10);
  const getUserQuery = `
    SELECT * FROM user 
    WHERE username = ${username};`;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    const createUser = `
    INSERT INTO user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${password}',
            '${gender}',
            '${location}');`;
    if (validatePassword(hashPassword)) {
      await db.run(createUser);
      respond.send("User Created Successfully");
    } else {
      respond.status(400);
      respond.send("Password is too short");
    }
  } else {
    respond.status(400);
    respond.send("User already exits");
  }
});

//API 2
app.post("/login", async (request, respond) => {
  const { username, password } = request.body;
  const getUserQuery = `
    SELECT * FROM user 
    WHERE username = ${username};`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    respond.status(400);
    respond.send("Invalid User");
  } else {
    const isPassword = bcrypt.compare(password, dbUser.password);

    if (isPassword === true) {
      respond.status(200);
      respond.send("Login success!");
    } else {
      respond.status(400);
      respond.send("Invalid Password");
    }
  }
});

//API 3
app.put("/change-password", async (request, respond) => {
  const { username, oldPassword, newPassword } = request.body;
  const getUserQuery = `
    SELECT * FROM user 
    WHERE username = ${username};`;
  const dbUser = await db.get(getUserQuery);

  if (dbUser === undefined) {
    respond.status(400);
    respond.send("Invalid User");
  } else {
    const isPasswordMatch = bcrypt.compare(oldPassword, dbUser.password);
    if (isPasswordMatch === true) {
      if (validatePassword(newPassword)) {
        const hashPassword = bcrypt.hash(newPassword, 10);
        const updatePassword = `
          UPDATE user
          SET 
          password = ${hashPassword}
          WHERE 
            username = ${username};`;
        const user = await db.run(updatePassword);
        respond.send("Password updated");
      } else {
        respond.status(400);
        respond.send("Password is too short");
      }
    } else {
      respond.status(400);
      respond.send("Invalid current Password");
    }
  }
});
module.exports = app;
