/**
 * @module Role
 *
 * @description
 *   Roles endow Admins with Permissions. Exposes Postgres-like API for
 *   resolving granted Permissions for a Admin.
 *
 * @see <http://www.postgresql.org/docs/9.3/static/sql-grant.html>
 */
module.exports = {
  autoCreatedBy: false,

  description: 'Confers `Permission` to `Admin`',

  attributes: {
    name: {
      type: 'string',
      // index: true,
      allowNull: false,
      unique: true
    },
    admins: {
      collection: 'Admin',
      via: 'roles'
    },
    active: {
      type: 'boolean',
      defaultsTo: true,
      // index: true
    },
    permissions: {
      collection: 'Permission',
      via: 'role'
    }
  }
};
