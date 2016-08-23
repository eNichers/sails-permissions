var Promise = require('bluebird');
// var methodMap = {
//     POST: 'create',
//     GET: 'read',
//     PUT: 'update',
//     DELETE: 'delete'
// };

var findRecords = require('sails/lib/hooks/blueprints/actions/find');
var wlFilter = require('waterline-criteria');

var anonymousPermessionsCache = null;

module.exports = {
     findAdminModelPermissions: function (admin,callback) {
        var isAnonymous = admin.adminName == sails.config.permissions.anonymousAdminname; 
        if(isAnonymous && anonymousPermessionsCache){
            callback(anonymousPermessionsCache);
            return;
        }

        return Admin.findOne({
            id: admin.id
        })
        .populate('roles')
        .then(function (admin) {
            return Model.find({}, {
                    action: 1,
                    attributes: 0

                })
                .populate('permissions', {
                    role: admin.roles[0].id
                }).then(function(modelPermissions){
                    if(isAnonymous){
                        anonymousPermessionsCache = modelPermissions;
                    }  
                    callback(modelPermissions);
                });
        }); 
        
        

    },
    resetAnonymousPermessionsCache: function(){
        anonymousPermessionsCache = null;
    },

    /**
     * Given an object, or a list of objects, return true if the list contains
     * objects not owned by the specified admin.
     */
    hasForeignObjects: function (objects, admin) {
        if (!_.isArray(objects)) {
            return PermissionService.isForeignObject(admin.id)(objects);
        }
        return _.any(objects, PermissionService.isForeignObject(admin.id));
    },

    /**
     * Return whether the specified object is NOT owned by the specified admin.
     */
    isForeignObject: function (owner) {
        return function (object) {
            //sails.log.verbose('object', object);
            //sails.log.verbose('object.owner: ', object.owner, ', owner:', owner);
            return object.owner !== owner;
        };
    },

    /**
     * Find objects that some arbitrary action would be performed on, given the
     * same request.
     *
     * @param options.model
     * @param options.query
     *
     * TODO this will be less expensive when waterline supports a caching layer
     */
    findTargetObjects: function (req) {


        // handle add/remove routes that have :parentid as the primary key field
        var originalId;
        if (req.params.parentid) {
            originalId = req.params.id;
            req.params.id = req.params.parentid;
        }

        return new Promise(function (resolve, reject) {
                findRecords(req, {
                    ok: resolve,
                    serverError: reject,
                    // this isn't perfect, since it returns a 500 error instead of a 404 error
                    // but it is better than crashing the app when a record doesn't exist
                    notFound: reject
                });
            })
            .then(function (result) {
                if (originalId !== undefined) {
                    req.params.id = originalId;
                }
                return result;
            });
    },

    /**
     * Query Permissions that grant privileges to a role/admin on an action for a
     * model.
     *
     * @param options.method
     * @param options.model
     * @param options.admin
     */
    findModelPermissions: function (options) {
        var action = options.action;
        return Admin.findOne(options.admin.id)
            .populate('roles')
            .then(function (admin) {
                return Permission.find({
                        model: options.model.id,
                        action: action,
                        or: [{
                            admin: admin.id
                        }, {
                            role: _.pluck(admin.roles, 'id')
                        }]
                    })
                    .populate('criteria');
            });
    },

    /**
     * Given a list of objects, determine if they all satisfy at least one permission's
     * where clause/attribute blacklist combination
     *
     * @param {Array of objects} objects - The result of the query, or if the action is create,
     * the body of the object to be created
     * @param {Array of Permission objects} permissions - An array of permission objects
     * that are relevant to this particular admin query
     * @param {Object} attributes - The body of the request, in an update or create request.
     * The keys of this object are checked against the permissions blacklist
     * @returns boolean - True if there is at least one granted permission that allows the requested action,
     * otherwise false
     */
    hasPassingCriteria: function (objects, permissions, attributes, admin) {
        // return success if there are no permissions or objects
        if (_.isEmpty(permissions) || _.isEmpty(objects)) return true;

        if (!_.isArray(objects)) {
            objects = [objects];
        }

        var criteria = permissions.reduce(function (memo, perm) {
            if (perm) {
                if (!perm.criteria || perm.criteria.length == 0) {
                    // If a permission has no criteria then it passes for all cases
                    // (like the admin role)
                    memo = memo.concat([{
                        where: {}
                    }]);
                }
                else {
                    memo = memo.concat(perm.criteria);
                }
                if (perm.relation === 'owner') {
                    perm.criteria.forEach(function (criteria) {
                        criteria.owner = true;
                    });
                }
                return memo;
            }
        }, []);


        if (!_.isArray(criteria)) {
            criteria = [criteria];
        }

        if (_.isEmpty(criteria)) {
            return true;
        }

        // every object must have at least one permission that has a passing criteria and a passing attribute check
        return objects.every(function (obj) {
            return criteria.some(function (criteria) {
                var match = wlFilter([obj], {
                        where: criteria.where
                    })
                    .results;
                var hasUnpermittedAttributes = PermissionService.hasUnpermittedAttributes(
                    attributes, criteria.blacklist);
                var hasOwnership = true; // edge case for scenario where a admin has some permissions that are owner based and some that are role based
                if (criteria.owner) {
                    hasOwnership = !PermissionService.isForeignObject(admin)
                        (obj);
                }
                return match.length === 1 && !hasUnpermittedAttributes &&
                    hasOwnership;
            });
        });

    },

    hasUnpermittedAttributes: function (attributes, blacklist) {
        if (_.isEmpty(attributes) || _.isEmpty(blacklist)) {
            return false;
        }
        return _.intersection(Object.keys(attributes), blacklist)
            .length ? true : false;
    },

    /**
     * Return true if the specified model supports the ownership policy; false
     * otherwise.
     */
    hasOwnershipPolicy: function (model) {
        return model.autoCreatedBy;
    },

    /**
     * Build an error message
     */
    getErrorMessage: function (options) {
        return [
            'Admin', options.admin.email, 'is not permitted to', options.method, options.model
            .globalId
        ].join(' ');
    },

    /**
     * Given an action, return the CRUD method it maps to.
     */
    // getMethod: function (method) {
    //     return methodMap[method];
    // },


    /**
     * create a new role
     * @param options
     * @param options.name {string} - role name
     * @param options.permissions {permission object, or array of permissions objects}
     * @param options.permissions.model {string} - the name of the model that the permission is associated with
     * @param options.permissions.criteria - optional criteria object
     * @param options.permissions.criteria.where - optional waterline query syntax object for specifying permissions
     * @param options.permissions.criteria.blacklist {string array} - optional attribute blacklist
     * @param options.admins {array of admin names} - optional array of admin ids that have this role
     */
    createRole: function (options) {

        var ok = Promise.resolve();
        var permissions = options.permissions;

        if (!_.isArray(permissions)) {
            permissions = [permissions];
        }


        // look up the model id based on the model name for each permission, and change it to an id
        ok = ok.then(function () {
            return Promise.map(permissions, function (permission) {
                return Model.findOne({
                        name: permission.model
                    })
                    .then(function (model) {
                        permission.model = model.id;
                        return permission;
                    });
            });
        });

        // look up admin ids based on adminNames, and replace the names with ids
        ok = ok.then(function (permissions) {
            if (options.admins) {
                return Admin.find({
                        adminName: options.admins
                    })
                    .then(function (admins) {
                        options.admins = admins;
                    });
            }
        });

        ok = ok.then(function (admins) {
            return Role.create(options);
        });

        return ok;
    },

    /**
     *
     * @param options {permission object, or array of permissions objects}
     * @param options.role {string} - the role name that the permission is associated with,
     *                                either this or admin should be supplied, but not both
     * @param options.admin {string} - the admin than that the permission is associated with,
     *                                either this or role should be supplied, but not both
     * @param options.model {string} - the model name that the permission is associated with
     * @param options.action {string} - the http action that the permission allows
     * @param options.criteria - optional criteria object
     * @param options.criteria.where - optional waterline query syntax object for specifying permissions
     * @param options.criteria.blacklist {string array} - optional attribute blacklist
     */
    grant: function (permissions) {
        if (!_.isArray(permissions)) {
            permissions = [permissions];
        }

        // look up the models based on name, and replace them with ids
        var ok = Promise.map(permissions, function (permission) {
            var findRole = permission.role ? Role.findOne({
                name: permission.role
            }) : null;
            var findAdmin = permission.admin ? Admin.findOne({
                adminName: permission.admin
            }) : null;
            return Promise.all([findRole, findAdmin, Model.findOne({
                    name: permission.model
                })])
                .spread(function (role, admin, model) {
                    permission.model = model.id;
                    if (role && role.id) {
                        permission.role = role.id;
                    }
                    else if (admin && admin.id) {
                        permission.admin = admin.id;
                    }
                    else {
                        return Promise.reject(new Error(
                            'no role or admin specified'));
                    }
                });
        });

        ok = ok.then(function () {
            return Permission.create(permissions);
        });

        return ok;
    },

    /**
     * add one or more admins to a particular role
     * TODO should this work with multiple roles?
     * @param adminNames {string or string array} - list of names of admins
     * @param rolename {string} - the name of the role that the admins should be added to
     */
    addAdminsToRole: function (adminNames, rolename) {
        if (_.isEmpty(adminNames)) {
            return Promise.reject(new Error('One or more adminNames must be provided'));
        }

        if (!_.isArray(adminNames)) {
            adminNames = [adminNames];
        }

        return Role.findOne({
                name: rolename
            })
            .populate('admins')
            .then(function (role) {
                return Admin.find({
                        adminName: adminNames
                    })
                    .then(function (admins) {
                        role.admins.add(_.pluck(admins, 'id'));
                        return role.save();
                    });
            });
    },

    /**
     * remove one or more admins from a particular role
     * TODO should this work with multiple roles
     * @params adminNames {string or string array} - name or list of names of admins
     * @params rolename {string} - the name of the role that the admins should be removed from
     */
    removeAdminsFromRole: function (adminNames, rolename) {
        if (_.isEmpty(adminNames)) {
            return Promise.reject(new Error('One or more adminNames must be provided'));
        }

        if (!_.isArray(adminNames)) {
            adminNames = [adminNames];
        }

        return Role.findOne({
                name: rolename
            })
            .populate('admins')
            .then(function (role) {
                return Admin.find({
                        adminName: adminNames
                    }, {
                        select: ['id']
                    })
                    .then(function (admins) {
                        admins.map(function (admins) {
                            role.admins.remove(admin.id);
                        });
                        return role.save();
                    });
            });
    },

    /**
     * revoke permission from role
     * @param options
     * @param options.role {string} - the name of the role related to the permission.  This, or options.admin should be set, but not both.
     * @param options.admin {string} - the name of the admin related to the permission.  This, or options.role should be set, but not both.
     * @param options.model {string} - the name of the model for the permission
     * @param options.action {string} - the name of the action for the permission
     * @param options.relation {string} - the type of the relation (owner or role)
     */
    revoke: function (options) {
        var findRole = options.role ? Role.findOne({
            name: options.role
        }) : null;
        var findAdmin = options.admin ? Admin.findOne({
            adminName: options.admin
        }) : null;
        var ok = Promise.all([findRole, findAdmin, Model.findOne({
            name: options.model
        })]);

        ok = ok.spread(function (role, admin, model) {

            var query = {
                model: model.id,
                action: options.action,
                relation: options.relation
            };

            if (role && role.id) {
                query.role = role.id;
            }
            else if (admin && admin.id) {
                query.admin = admin.id;
            }
            else {
                return Promise.reject(new Error(
                    'You must provide either a admin or role to revoke the permission from'
                ));
            }

            return Permission.destroy(query);
        });

        return ok;
    },

    /**
     * Check if the admin (out of role) is granted to perform action on given objects
     * @param objects
     * @param admin
     * @param action
     * @param model
     * @param body
     * @returns {*}
     */
    isAllowedToPerformAction: function (objects, admin, action, model, body) {
        if (!_.isArray(objects)) {
            return PermissionService.isAllowedToPerformSingle(admin.id, action, model, body)
                (objects);
        }
        return new Promise.map(objects, PermissionService.isAllowedToPerformSingle(admin.id,
                action, model, body))
            .then(function (allowedArray) {
                return allowedArray.every(function (allowed) {
                    return allowed === true;
                });
            });
    },

    /**
     * Resolve if the admin have the permission to perform this action
     * @param admin
     * @param action
     * @param model
     * @param body
     * @returns {Function}
     */
    isAllowedToPerformSingle: function (admin, action, model, body) {
        return function (obj) {
            return new Promise(function (resolve, reject) {
                Model.findOne({
                        identity: model
                    })
                    .then(function (model) {
                        return Permission.find({
                                model: model.id,
                                action: action,
                                relation: 'admin',
                                admin: admin
                            })
                            .populate('criteria');
                    })
                    .then(function (permission) {
                        if (permission.length > 0 && PermissionService.hasPassingCriteria(
                                obj, permission, body)) {
                            resolve(true);
                        }
                        else {
                            resolve(false);
                        }
                    })
                    .catch(reject);
            });
        };
    }
};
