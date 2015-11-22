var Promise = require('bluebird');

// var grants = {
//     admin: [{
//         action: 'create'
//     }, {
//         action: 'read'
//     }, {
//         action: 'update'
//     }, {
//         action: 'delete'
//     }],
//     registered: [{
//         action: 'create'
//     }, {
//         action: 'read'
//     }],
//     public: [{
//         action: 'read'
//     }]
// };


// var modelRestrictions = {
//     registered: [
//         'Role',
//         'Permission',
//         'Employee',
//         'Passport'
//     ],
//     public: [
//         'Role',
//         'Permission',
//         'Employee',
//         'Model',
//         'Passport'
//     ]
// };



// TODO let employees override this in the actual model definition

/**
 * Create default Role permissions
 */
exports.create = function (roles, models, admin) {

    return Promise.all([
            grantAdminPermissions(roles, models, admin),
            //grantPublicPermissions(roles, models),
            // ,
            // grantRegisteredPermissions(roles, models, admin)
        ])
        .then(function (permissions) {

            //sails.log.verbose('created', permissions.length, 'permissions');
            return permissions;
        });
};

function grantAdminPermissions(roles, models, admin) {
    var adminRole = _.find(roles, {
        name: 'admin'
    });

    var controllers = sails.controllers;

    controllers = _.filter(controllers, function (controller, name) {

        var model = _.find(models, {
            identity: name
        });

        return model != undefined;
    });



    var permissions = _.flatten(_.map(controllers, function (controller) {

        var actions = _.remove(Object.keys(controller), function (action) {
            return !_.contains(['identity', 'globalId', 'sails'], action);
        });

        var model = _.find(models, {
            identity: controller.identity
        });


        return _.map(actions, function (action) {

            var newPermission = {
                model: model.id,
                action: action,
                role: adminRole.id,
            };

            return Permission.findOrCreate(newPermission, newPermission);

        });

    }));

    return Promise.all(permissions);
}


// function grantRegisteredPermissions(roles, models, admin) {
//     var registeredRole = _.find(roles, {
//         name: 'registered'
//     });
//     var permissions = [{
//         model: _.find(models, {
//                 name: 'Permission'
//             })
//             .id,
//         action: 'read',
//         role: registeredRole.id
//     }, {
//         model: _.find(models, {
//                 name: 'Model'
//             })
//             .id,
//         action: 'read',
//         role: registeredRole.id
//     }, {
//         model: _.find(models, {
//                 name: 'Employee'
//             })
//             .id,
//         action: 'update',
//         role: registeredRole.id,
//         relation: 'owner'
//     }, {
//         model: _.find(models, {
//                 name: 'Employee'
//             })
//             .id,
//         action: 'read',
//         role: registeredRole.id,
//         relation: 'owner'
//     }];

//     return Promise.all(
//         _.map(permissions, function (permission) {
//             return Permission.findOrCreate(permission, permission);
//         })
//     );
// }
