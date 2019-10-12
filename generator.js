module.exports = require('sails-generate-entities')({
  module: 'sails-permissions',
  id: 'permissions-api',
  statics: [
    'config/permissions.js'
    'api/models/Admin.js',
    'api/controllers/AdminController.js',
  ],
});
