/**
 * Create admin admin.
 * @param adminRole - the admin role which grants all permissions
 */
exports.create = function (roles, adminModel) {
    if (_.isEmpty(sails.config.permissions.adminName)) {
        throw new Error('sails.config.permissions.adminName is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminPassword)) {
        throw new Error('sails.config.permissions.adminPassword is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminEmail)) {
        throw new Error('sails.config.permissions.adminEmail is not set');
    }


    return Admin.findOne({
            adminName: sails.config.permissions.adminName
        })
        .then(function (admin) {
            if (admin) return admin;

            sails.log.info('sails-permissions: admin admin does not exist; creating...');
            return Admin.register({
                adminName: sails.config.permissions.adminName,
                password: sails.config.permissions.adminPassword,
                email: sails.config.permissions.adminEmail,
                roles: [_.find(roles, {
                        name: 'admin'
                    })
                    .id
                ],
                createdBy: 1,
                owner: 1,
                model: adminModel.id
            });
        });
};
