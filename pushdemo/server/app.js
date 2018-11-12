const {Expo} = require('expo-server-sdk'); //Remember to npm install this expo component
const express = require('express');
const app = express();
const PORT = 2345;
app.use(express.json());

const users = []
let userId = 1;
app.post("/register", ((req, res) => {
  const newUser = req.body;
  console.log("User logged in: ",newUser.id);
  const index = users.findIndex(u => u.id === newUser.id);
  if (index >= 0) {  //Remove user if he already exists
    users.splice(index, 1);
  }
  if (users.length > 0) {
    notifyUsers(users, newUser);
  }
  users.push(newUser);
  res.json(newUser);
}))

app.listen(PORT, () => console.log("Server started, listening on "+PORT));


async function notifyUsers(users, newUser) {
  let expo = new Expo();
  // Create the messages that you want to send to clients
  let messages = [];
  for (let user of users) {
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
      continue;
    }
    messages.push({
      to: user.pushToken,
      sound: 'default',
      body: 'new User logged in',
      data: newUser,
    })
  }
  console.log("messages to send",messages.length)
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];

  for (let chunk of chunks) {
    try {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("Ticket: ",ticketChunk)
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  };
}




