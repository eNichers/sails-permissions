var _ = require('lodash');
var permissionPolicies = [
    'passport',
    'sessionAuth',
    'ModelPolicy',
    'OwnerPolicy',
    'PermissionPolicy',
    'RolePolicy'
];
module.exports = function (sails) {
    return {
        identity: 'permissions',

        /**
         * Local cache of Model name -> id mappings to avoid excessive database lookups.
         */
        _modelCache: {},

        defaults: {

            controllersRoot: "",
            exceptedActions: [],
            anonymousDisabled:false,
            adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
            adminEmployeeName: process.env.ADMIN_EMPLOYEENAME || 'admin',
            adminPassword: process.env.ADMIN_PASSWORD || 'admin1234',

            afterEvent: [],
            
            allowUnknownModelDefinitions: false,
            anonymousEmployeename: process.env.ANONYMOUS_USERNAME || 'anonymous',
            anonymousPassword: process.env.ANONYMOUS_PASSWORD || '12345678',
            anonymousEmail: process.env.ANONYMOUS_EMAIL || 'anonymous@example.com',
        },

        configure: function () {
            if (!_.isObject(sails.config.permissions)) sails.config.permissions = {};

            sails.config.blueprints.populate = false;
        },
        initialize: function (next) {
            sails.log.info('permissions: initializing sails-permissions hook');

            if (!validateDependencies(sails)) {
                sails.log.error(
                    'Cannot find sails-auth hook. Did you "npm install sails-auth --save"?'
                );
                sails.log.error(
                    'Please see README for installation instructions: https://github.com/tjwebb/sails-permissions'
                );
                return sails.lower();
            }

            // if (!validatePolicyConfig(sails)) {
            //     sails.log.error('One or more required policies are missing.');
            //     sails.log.error(
            //         'Please see README for installation instructions: https://github.com/tjwebb/sails-permissions'
            //     );
            //     return sails.lower();
            // }


            sails.after(sails.config.permissions.afterEvent, function () {
                installModelOwnership(sails);
            });

            sails.after('hook:orm:loaded', function () {
                Model.count()
                    .then(function (count) {
                        if (count == sails.models.length) return next();

                        return initializeFixtures(sails)
                            .then(function () {
                                sails.emit('hook:permissions:loaded');
                                next();
                            });
                    })
                    .catch(function (error) {
                        sails.log.error(error);
                        next(error);
                    });
            });
        }
    };
};

/**
 * Install the application. Sets up default Roles, Employees, Models, and
 * Permissions, and creates an admin employee.
 */
function initializeFixtures(sails) {

    return require('../../config/fixtures/model')
        .createModels()
        .bind({})
        .then(function (models) {
            this.models = models;

            sails.hooks['sails-permissions']._modelCache = _.indexBy(models, 'identity');

            return require('../../config/fixtures/role')
                .create();
        })
        .then(function (roles) {
            this.roles = roles;
            var employeeModel = _.find(this.models, {
                name: sails.config.permissions.controllersRoot+'employee'
            });

            return require('../../config/fixtures/employee')
                .create(this.roles, employeeModel);
        })
        .then(function () {
            return Employee.findOne({
                employeeName: sails.config.permissions.adminEmployeeName
            });
        })
        .then(function (employee) {
            sails.log.verbose('sails-permissions: created admin employee:', employee);
            employee.createdBy = employee.id;
            employee.owner = employee.id;
            return employee.save();
        })
        .then(function (admin) {

            return require('../../config/fixtures/permission')
                .create(this.roles, this.models, admin);
        })
        .catch(function (error) {
            sails.log.error(error);
        });
}

function installModelOwnership(sails) {
    var models = sails.models;
    if (sails.config.models.autoCreatedBy === false) return;

    _.each(models, function (model) {
        if (model.autoCreatedBy === false) return;

        _.defaults(model.attributes, {
            createdBy: {
                model: 'Employee',
                index: true
            },
            owner: {
                model: 'Employee',
                index: true
            }
        });
    });
}

function validatePolicyConfig(sails) {
    var policies = sails.config.policies;
    return _.all([
        _.isArray(policies['*']),
        _.intersection(permissionPolicies, policies['*'])
        .length === permissionPolicies.length,
        policies.AuthController && _.contains(policies.AuthController['*'], 'passport')
    ]);
}

function validateDependencies(sails) {
    return !!sails.hooks['sails-auth'];
}

