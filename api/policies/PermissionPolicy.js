var _ = require('lodash');
var Promise = require('bluebird');
/**
 * PermissionPolicy
 * @depends OwnerPolicy
 * @depends ModelPolicy
 *
 * In order to proceed to the controller, the following verifications
 * must pass:
 * 1. Employee is logged in (handled previously by sails-auth sessionAuth policy)
 * 2. Employee has Permission to perform action on Model
 * 3. Employee has Permission to perform action on Attribute (if applicable) [TODO]
 * 4. Employee is satisfactorily related to the Object's owner (if applicable)
 *
 * This policy verifies #1-2 here, before any controller is invoked. However
 * it is not generally possible to determine ownership relationship until after
 * the object has been queried. Verification of #4 occurs in RolePolicy.
 *
 * @param {Object}   req
 * @param {Object}   res
 * @param {Function} next
 */
module.exports = function (req, res, next) {
    var options = {
        model: req.model,
        method: req.method,
        employee: req.employee,
        action: req.options.action
    };

    if (req.options.unknownModel) {
        return next();
    }

    PermissionService
        .findModelPermissions(options)
        .then(function (permissions) {
            sails.log.silly('PermissionPolicy:', permissions.length, 'permissions grant',
                req.method, 'on', req.model.name, 'for', req.employee.employeeName);

            if (!permissions || permissions.length === 0) {
                return res.forbidden({
                    error: PermissionService.getErrorMessage(options)
                });
            }

            req.permissions = permissions;

            next();
        });
};

function bindResponsePolicy(req, res) {
    res._ok = res.ok;

    res.ok = _.bind(responsePolicy, {
        req: req,
        res: res
    });
}

function responsePolicy(_data, options) {
    var req = this.req;
    var res = this.res;
    var employee = req.owner;
    var method = PermissionService.getMethod(req);

    var data = _.isArray(_data) ? _data : [_data];

    //sails.log.verbose('data', _data);
    //sails.log.verbose('options', options);

    // TODO search populated associations
    Promise.bind(this)
        .map(data, function (object) {
            return employee.getOwnershipRelation(data);
        })
        .then(function (results) {
            //sails.log.verbose('results', results);
            var permitted = _.filter(results, function (result) {
                return _.any(req.permissions, function (permission) {
                    return permission.permits(result.relation, method);
                });
            });

            if (permitted.length === 0) {
                //sails.log.verbose('permitted.length === 0');
                return res.send(404);
            }
            else if (_.isArray(_data)) {
                return res._ok(permitted, options);
            }
            else {
                res._ok(permitted[0], options);
            }
        });
}
