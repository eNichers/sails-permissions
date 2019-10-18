/**
 * Create admin admin.
 * @param adminRole - the admin role which grants all permissions
 */
import _ from 'lodash'
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


    return sails.models.admin.findOne({
            adminName: sails.config.permissions.adminName
        })
        .then(function (admin) {
            if (admin) return admin;

            sails.log.info('sails-permissions: admin admin does not exist; creating...');
            return sails.models.admin.register({
                adminName: sails.config.permissions.adminName,
                password: sails.config.permissions.adminPassword,
                email: sails.config.permissions.adminEmail,
                roles: [_.find(roles, {
                        name: 'admin'
                    })
                    .id
                ],
                createdBy: null,
                owner: null,
                model: adminModel.id
            });
        });
};
