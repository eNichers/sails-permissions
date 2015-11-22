var _ = require('lodash');

/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: Simple policy to allow any authenticated employee
 *                 Assumes that your login action in one of your controllers sets `req.session.authenticated = true;`
 * @docs        :: http://sailsjs.org/#!/documentation/concepts/Policies
 *
 */
module.exports = function (req, res, next) {
    // Employee is allowed, proceed to the next policy, 
    // or if this is the last policy, the controller 

    var callback = function (employee) {
        employee.isAdmin = employee.employeeName == sails.config.permissions.adminEmployeename;
        employee.isAnonymous = employee.employeeName == sails.config.permissions.anonymousEmployeename;

        PermissionService.findEmployeeModelPermissions(employee,function(modelPermissions){

                modelPermissions = _.transform(_.indexBy(modelPermissions, 'identity'),
                    function (result, val, key) {
                        result[key] = _.pluck(val.permissions, 'action');
                    });

                employee.can = function (action, model) {
                    if(!model){
                        model = req.options.controller;
                    }
                    return _.contains(modelPermissions[model], action);
                };


                return next();
            });
    }

    if (!req.session.authenticated) {
        EmployeeService.findAnonymousEmployee(function (employee) {
            req.employee = employee;
            callback(req.employee);
        });
    }
    else {
        callback(req.employee);
    }

    // Employee is not allowed
    // (default res.forbidden() behavior can be overridden in `config/403.js`)
    // return res.forbidden('You are not permitted to perform this action.');


};
