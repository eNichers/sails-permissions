var _ = require('lodash');

/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated user
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
    // User is allowed, proceed to the next policy, 
    // or if this is the last policy, the controller 

    var callback = function (user) {
        user.isAdmin = user.username == sails.config.permissions.adminUsername;
        user.isAnonymous = user.username == sails.config.permissions.anonymousUsername;

        PermissionService.findUserModelPermissions(user,function(modelPermissions){

                modelPermissions = _.transform(_.indexBy(modelPermissions, 'identity'),
                    function (result, val, key) {
                        result[key] = _.pluck(val.permissions, 'action');
                    });

                user.can = function (action, model) {
                    if(!model){
                        model = req.options.controller;
                    }
                    return _.contains(modelPermissions[model], action);
                };


                return next();
            });
    }

    if (!req.session.authenticated) {
        UserService.findAnonymousUser(function (user) {
            req.user = user;
            callback(req.user);
        });
    }
    else {
        callback(req.user);
    }

    // User is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // return res.forbidden('You are not permitted to perform this action.');


};
