/**
 * @module Model
 *
 * @description
 *   Abstract representation of a Waterline Model.
 */
module.exports = {
  description: 'Represents a Waterline collection that a Admin can create, query, etc.',

  autoCreatedBy: false,

  attributes: {
    name: {
      type: 'string',
      allowNull: false,
      unique: true
    },
    identity: {
      type: 'string',
      allowNull: false
    },
    attributes: {
      type: 'json'
    },
    permissions: {
      collection: 'Permission',
      via: 'model'
    }
  }
};
