const https = require('https');
const querystring = require('querystring');

function httpsRequest(url, method, data) {
  // eslint-disable-next-line node/no-unsupported-features/node-builtins
  const urlObject = new URL(url);
  const postData = querystring.stringify(data);
  const options = {
    hostname: urlObject.hostname,
    path: urlObject.pathname,
    port: 443,
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': postData.length
    }
  };

  return new Promise((resolve, reject) => {
    const clientRequest = https.request(options, incomingMessage => {
      const response = {
        statusCode: incomingMessage.statusCode,
        headers: incomingMessage.headers,
        body: []
      };

      incomingMessage.on('data', chunk => {
        response.body.push(chunk);
      });

      incomingMessage.on('end', () => {
        if (response.body.length) {
          response.body = response.body.join();
          try {
            response.body = JSON.parse(response.body);
          } catch (error) {
            //Not JSON format
          }
        }
        resolve(response);
      });
    });

    clientRequest.on('error', error => {
      reject(error);
    });

    if (postData) {
      clientRequest.write(postData);
    }
    clientRequest.end();
  });
}

module.exports = httpsRequest;
