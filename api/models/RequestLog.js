/**
* RequestLog.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {
  primaryKey: 'id',
  dontUseObjectIds: true, // This allows you to create models using the sails-mongo adapter with primary keys that are arbitrary strings or numbers, not just big long UUID-looking things


  attributes: {
    id: {
      type: 'string',
      columnName: '_id' // When using `sails-mongo`, primary keys MUST have `columnName: '_id'`
    },
    ipAddress: {
      type: 'string'
    },
    method: {
      type: 'string'
    },
    url: {
      type: 'string',
      isURL: true
    },
    body: {
      type: 'json'
    },
    admin: {
      model: 'Admin'
    },
    model: {
      type: 'string'
    }
  }
};

