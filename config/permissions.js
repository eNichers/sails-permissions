module.exports.permissions = {
  name: 'permissions',

  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminName: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',

  afterEvents: [
    'hook:auth:initialized'
  ]
};
