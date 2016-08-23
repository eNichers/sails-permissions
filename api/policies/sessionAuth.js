var _ = require('lodash');

/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated admin
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
    // Admin is allowed, proceed to the next policy, 
    // or if this is the last policy, the controller 

    var callback = function (admin) {
        admin.isAdmin = admin.adminName == sails.config.permissions.adminName;
        admin.isAnonymous = admin.adminName == sails.config.permissions.anonymousAdminname;

        PermissionService.findAdminModelPermissions(admin, function (modelPermissions) {

            modelPermissions = _.transform(_.indexBy(modelPermissions, 'identity'),
                function (result, val, key) {
                    result[key] = _.pluck(val.permissions, 'action');
                });

            admin.can = function (action, model) {
                if (!model) {
                    model = req.options.controller;
                }
                return _.contains(modelPermissions[model], action);
            };


            return next();
        });
    }

    if (!req.session.authenticated) {
        if (sails.config.permissions.anonymousDisabled) {
            // Admin is not allowed
            // (default res.forbidden() behavior can be overridden in `config/403.js`)
            return res.forbidden('You are not permitted to perform this action.');
        }
        else {
            AdminService.findAnonymousAdmin(function (admin) {
                req.admin = admin;
                callback(req.admin);
            });
        }

    }
    else {
        req.admin = req.user;
        delete req.user; 
        callback(req.admin);
    }


};
