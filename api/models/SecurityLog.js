/**
* SecurityLog.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  // primaryKey: 'request', // causes an error if not commented because it forces a type to the attribute

  attributes: {
    request: {
      model: 'RequestLog'
    }
  }
};

