const request = require('../utils/https-request');

function Oauth2({ clientID, clientSecret, callbackURL, scopes, prompt }) {
  this._clientID = clientID;
  this._clientSecret = clientSecret;
  this._callbackURL = callbackURL;
  this._scope = scopes;
  this._prompt = prompt;
  this._url = {
    auth: 'https://discordapp.com/api/oauth2/authorize',
    token: 'https://discordapp.com/api/oauth2/token',
    revoke: 'https://discordapp.com/api/oauth2/token/revoke'
  };
}

Oauth2.prototype._authenticate = async function(req, res, next, callback) {
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

  callback(response);
  next();
};

Oauth2.prototype.authenticate = function(callback) {
  return function(req, res, next) {
    this._authenticate(req, res, next, callback);
  }.bind(this);
};

Oauth2.prototype._redirect = function(req, res) {
  const url = `${this._url.auth}?response_type=code&client_id=${
    this._clientID
  }&prompt=${this._prompt}&scope=${this._scope.replace(/ /g, '%20')}`;
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.setHeader('Content-Length', '0');
  res.end();
};

Oauth2.prototype.redirect = function(req, res) {
  return function(req, res) {
    this._redirect(req, res);
  }.bind(this);
};

module.exports = Oauth2;
