// middleware to validate an incoming request for a token
// validation is done by auth-api
const axios = require('axios');

const HttpError = require('../models/http-error');
const { getEnvVar } = require('../helpers/getEnvVar');

module.exports = async (req, res, next) => {
  let token;
  if (req.method === 'OPTIONS') { // ignore OPTIONS requests from browser
    return next();
  }
  try {
    token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) {
      console.log('check-auth: !token');
      throw new Error('check-auth failed!');
    }
  } catch (err) {
    console.log('check-auth: Authorization token missing!');
    return next(new HttpError('check-auth failed!', 403));
  }

  const authApiAddress = getEnvVar('AUTH_API_ADDRESS');
  let decodedToken;
  try {
    // console.log("Getting id from auth-api");
    // process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    decodedToken = await axios.post(
      `https://${authApiAddress}/verify-token`,
      {
        "token": token
      }
    );
    req.userData = {
      userId: decodedToken.data.uid
    };
    next();
  } catch (err) {
    console.log('check-auth: verify token error');
    return next(new HttpError('check-auth verify token error!', 403));
  }
};
