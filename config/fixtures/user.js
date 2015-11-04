/**
 * Create admin user.
 * @param adminRole - the admin role which grants all permissions
 */
exports.create = function (roles, userModel) {
    if (_.isEmpty(sails.config.permissions.adminUsername)) {
        throw new Error('sails.config.permissions.adminUsername is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminPassword)) {
        throw new Error('sails.config.permissions.adminPassword is not set');
    }
    if (_.isEmpty(sails.config.permissions.adminEmail)) {
        throw new Error('sails.config.permissions.adminEmail is not set');
    }

    var anonymous = sails.config.permissions.anonymousUsername || 'anonymous';
    User.findOne({
            username: anonymous
        })
        .then(function (user) {
            if (user) return user;

            sails.log.info('sails-permissions: anonymous user does not exist; creating...');
            return User.register({
                username: sails.config.permissions.anonymousUsername,
                password: sails.config.permissions.anonymousPassword,
                email: sails.config.permissions.anonymousEmail,
                roles: [_.find(roles, {
                        name: 'public'
                    })
                    .id
                ],
                createdBy: 1,
                owner: 1,
                model: userModel.id
            });
        });


    return User.findOne({
            username: sails.config.permissions.adminUsername
        })
        .then(function (user) {
            if (user) return user;

            sails.log.info('sails-permissions: admin user does not exist; creating...');
            return User.register({
                username: sails.config.permissions.adminUsername,
                password: sails.config.permissions.adminPassword,
                email: sails.config.permissions.adminEmail,
                roles: [_.find(roles, {
                        name: 'admin'
                    })
                    .id
                ],
                createdBy: 1,
                owner: 1,
                model: userModel.id
            });
        });
};
