var _ = require('lodash');
var _super = require('sails-auth/api/models/Employee');
var Promise = require('bluebird');

_.merge(exports, _super);
_.merge(exports, {
    attributes: {
        roles: {
            collection: 'Role',
            via: 'employees',
            dominant: true
        },
        permissions: {
            collection: "Permission",
            via: "employee"
        }
    },

    /**
     * Attach default Role to a new Employee
     */
    afterCreate: [
        function setOwner(employee, next) {
            sails.log.verbose('Employee.afterCreate.setOwner', employee);
            Employee
                .update({
                    id: employee.id
                }, {
                    owner: employee.id
                })
                .then(function (employee) {
                    next();
                })
                .catch(function (e) {
                    sails.log.error(e);
                    next(e);
                });
        },
        function attachDefaultRole(employee, next) {
            // Promise.bind({ }, Employee.findOne(employee.id)
            //   .populate('roles')
            //   .then(function (employee) {
            //     this.employee = employee;
            //     return Role.findOne({ name: 'registered' });
            //   })
            //   .then(function (role) {
            //     this.employee.roles.add(role.id);
            //     return this.employee.save();
            //   })
            //   .then(function (updatedEmployee) {
            //     sails.log.silly('role "registered" attached to employee', this.employee.employeeName);
            //     next();
            //   })
            //   .catch(function (e) {
            //     sails.log.error(e);
            //     next(e);
            //   })
            // );
            next()
        }
    ]
});
