var _ = require('lodash');
var _super = require('sails-auth/api/models/Admin');
var Promise = require('bluebird');

_.merge(exports, _super);
_.merge(exports, {
    attributes: {
        roles: {
            collection: 'Role',
            via: 'admins',
            dominant: true
        },
        permissions: {
            collection: "Permission",
            via: "admin"
        }
    },

    /**
     * Attach default Role to a new Admin
     */
    afterCreate: (admin, next) => {
        sails.log.verbose('Admin.afterCreate.setOwner', admin);
        Admin
            .update({
                id: admin.id
            }, {
                owner: admin.id
            })
            .then(function (admin) {
                next();
            })
            .catch(function (e) {
                sails.log.error(e);
                next(e);
            });

        // Promise.bind({ }, Admin.findOne(admin.id)
        //   .populate('roles')
        //   .then(function (admin) {
        //     this.admin = admin;
        //     return Role.findOne({ name: 'registered' });
        //   })
        //   .then(function (role) {
        //     this.admin.roles.add(role.id);
        //     return this.admin.save();
        //   })
        //   .then(function (updatedAdmin) {
        //     sails.log.silly('role "registered" attached to admin', this.admin.adminName);
        //     next();
        //   })
        //   .catch(function (e) {
        //     sails.log.error(e);
        //     next(e);
        //   })
        // );
        // next()
    }
});
