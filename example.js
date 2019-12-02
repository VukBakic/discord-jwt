/* eslint-disable no-console */
/* eslint-disable import/order */
const DiscordAuth = require('./lib/Oauth2');

const dotenv = require('dotenv');

const express = require('express');

const app = express();

const port = 3000;

dotenv.config({ path: './config.env' });

const Auth = new DiscordAuth({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/api/discord/callback',
  scopes: 'identify email connections',
  prompt: 'consent',
  jwtSecret: 'orange'
});

app.use(express.json());

app.get('/api/discord/login', Auth.redirect());

app.get('/api/discord/callback', Auth.authenticate(), (req, res, next) => {
  res.send(`<img src=${req.user.avatar}></img>${JSON.stringify(req.user)}`);
});

app.all('*', (req, res, next) => {
  res.statusCode = 404;
  res.send('Not Found');
});

app.use(function(error, req, res, next) {
  res.json({ message: error.message });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
