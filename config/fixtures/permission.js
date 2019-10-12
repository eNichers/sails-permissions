var _ = require('lodash');

// var grants = {
//   admin: [
//     { action: 'create' },
//     { action: 'read' },
//     { action: 'update' },
//     { action: 'delete' }
//   ],
//   registered: [
//     { action: 'create' },
//     { action: 'read' }
//   ],
//   public: [
//     { action: 'read' }
//   ]
// };

// var modelRestrictions = {
//   registered: [
//     'Role',
//     'Permission',
//     'User',
//     'Passport'
//   ],
//   public: [
//     'Role',
//     'Permission',
//     'User',
//     'Model',
//     'Passport'
//   ]
// };

// TODO let admins override this in the actual model definition

/**
 * Create default Role permissions
 */
exports.create = function (roles, models, admin, config) {

    return Promise.all([
            grantAdminPermissions(roles, models, admin, config),
            //grantPublicPermissions(roles, models),
            // ,
            // grantRegisteredPermissions(roles, models, admin,  config)
        ])
        .then(function (permissions) {
            //sails.log.verbose('created', permissions.length, 'permissions');
            return permissions;
        });
};

function grantAdminPermissions(roles, models, admin, config) {
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


    var exceptedActions = ['identity', 'globalId', 'sails'];
    var extraExceptedActions = sails.config.permissions.exceptedActions;
    if(extraExceptedActions && extraExceptedActions.length > 0){
        exceptedActions = exceptedActions.concat(extraExceptedActions);
    }
    var permissions = _.flatten(_.map(controllers, function (controller) {

        var actions = _.remove(Object.keys(controller), function (action) {
            return !_.contains(exceptedActions, action);
        });

        var model = _.find(models, {
            identity: controller.identity
        });


        return _.map(actions, function (action) {

            var newPermission = {
                model: model.id,
                action: action.toLowerCase(),
                role: adminRole.id,
            };

            return sails.models.permission.findOrCreate(newPermission, newPermission);

        });

    }));

    return Promise.all(permissions);
}


// function grantRegisteredPermissions(roles, models, admin, config) {
//     var registeredRole = _.find(roles, {
//         name: 'registered'
//     });
//     var basePermissions = [{
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
//                 name: 'Admin'
//             })
//             .id,
//         action: 'update',
//         role: registeredRole.id,
//         relation: 'owner'
//     }, {
//         model: _.find(models, {
//                 name: 'Admin'
//             })
//             .id,
//         action: 'read',
//         role: registeredRole.id,
//         relation: 'owner'
//     }];

//    XXX copy/paste from above. terrible. improve.
//    var permittedModels = _.filter(models, function (model) {
//      return !_.contains(modelRestrictions.registered, model.name);
//    });
//    var grantPermissions = _.flatten(_.map(permittedModels, function (modelEntity) {

//      grants.registered = _.get(config, 'grants.registered') || grants.registered;

//      return _.map(grants.registered, function (permission) {
//          return {
//              model: modelEntity.id,
//              action: permission.action,
//              role: registeredRole.id,
//          };
//      });
//    }));


//  return Promise.all(
//    [ ...basePermissions, ...grantPermissions ].map(permission => {
//      return sails.models.permission.findOrCreate(permission, permission);
//    })
//  );
// }

