/**
 * Create admin employee.
 * @param adminRole - the admin role which grants all permissions
 */
exports.create = function (roles, employeeModel) {
    if (_.isEmpty(sails.config.permissions.adminEmployeename)) {
        throw new Error('sails.config.permissions.adminEmployeename is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminPassword)) {
        throw new Error('sails.config.permissions.adminPassword is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminEmail)) {
        throw new Error('sails.config.permissions.adminEmail is not set');
    }


    return Employee.findOne({
            employeeName: sails.config.permissions.adminEmployeename
        })
        .then(function (employee) {
            if (employee) return employee;

            sails.log.info('sails-permissions: admin employee does not exist; creating...');
            return Employee.register({
                employeeName: sails.config.permissions.adminEmployeename,
                password: sails.config.permissions.adminPassword,
                email: sails.config.permissions.adminEmail,
                roles: [_.find(roles, {
                        name: 'admin'
                    })
                    .id
                ],
                createdBy: 1,
                owner: 1,
                model: employeeModel.id
            });
        });
};
