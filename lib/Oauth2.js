/* eslint-disable node/no-unsupported-features/es-syntax */
const jwt = require('jsonwebtoken');

const request = require('../utils/https-request');

const catchAsync = require('../utils/catchAsync');

const OError = require('../utils/oauth2Error');

function Oauth2({
  clientID,
  clientSecret,
  callbackURL,
  scopes,
  prompt,
  jwtSecret
}) {
  this._clientID = clientID;
  this._clientSecret = clientSecret;
  this._callbackURL = callbackURL;
  this._scope = scopes;
  this._prompt = prompt;
  this._url = {
    auth: 'https://discordapp.com/api/oauth2/authorize',
    token: 'https://discordapp.com/api/oauth2/token',
    revoke: 'https://discordapp.com/api/oauth2/token/revoke',
    api: 'https://discordapp.com/api/'
  };
  this._jwtSecret = jwtSecret;
}

Oauth2.prototype._userData = async function(token) {
  const req = await request(`${this._url.api}/users/@me`, 'GET', null, {
    Authorization: `Bearer ${token}`
  });
  return {
    error: req.statusCode !== 200,
    statusCode: req.statusCode,
    userData: req.body
  };
};

Oauth2.prototype.avatar = function(id, hash, size) {
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.png${
    size ? `?size=${size}` : ''
  }`;
};

Oauth2.prototype._authenticate = async function(req, res, next) {
  const { code } = req.query;

  const data = {
    client_id: this._clientID,
    client_secret: this._clientSecret,
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: this._callbackURL,
    scope: this._scope
  };
  const response = await request(this._url.token, 'POST', data);

  const { error, statusCode, userData } = await this._userData(
    response.body.access_token
  );
  if (error) {
    const AuthError = new OError(userData.message, statusCode);
    return next(AuthError);
  }

  const jwtToken = jwt.sign(
    { id: userData.id, token: response.body.access_token },
    this._jwtSecret,
    {
      algorithm: 'HS256'
    }
  );
  userData.avatar = this.avatar(userData.id, userData.avatar);
  req.user = { ...userData, jwt: jwtToken };

  next();
};

Oauth2.prototype.authenticate = function() {
  return catchAsync(
    async function(req, res, next) {
      this._authenticate(req, res, next);
    }.bind(this)
  );
};

Oauth2.prototype._redirect = function(req, res) {
  const url = `${this._url.auth}?response_type=code&client_id=${
    this._clientID
  }&prompt=${this._prompt}&scope=${encodeURIComponent(this._scope)}`;
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.setHeader('Content-Length', '0');
  res.end();
};

Oauth2.prototype.redirect = function(req, res) {
  // eslint-disable-next-line no-shadow
  return function(req, res) {
    this._redirect(req, res);
  }.bind(this);
};

module.exports = Oauth2;
