/**
 * @module Role
 *
 * @description
 *   Roles endow Employees with Permissions. Exposes Postgres-like API for
 *   resolving granted Permissions for a Employee.
 *
 * @see <http://www.postgresql.org/docs/9.3/static/sql-grant.html>
 */
module.exports = {
  autoCreatedBy: false,

  description: 'Confers `Permission` to `Employee`',

  attributes: {
    name: {
      type: 'string',
      index: true,
      notNull: true,
      unique: true
    },
    employees: {
      collection: 'Employee',
      via: 'roles'
    },
    active: {
      type: 'boolean',
      defaultsTo: true,
      index: true
    },
    permissions: {
      collection: 'Permission',
      via: 'role'
    }
  }
};
