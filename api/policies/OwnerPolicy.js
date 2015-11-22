/**
 * TODO - this is setting createdBy, not owner.
 * The comment below, and the name of this file/function is confusing to me
 * Ensure that the 'owner' property of an Object is set upon creation.
 */
module.exports = function OwnerPolicy(req, res, next) {
    //sails.log('OwnerPolicy()');
    if (!req.employee || !req.employee.id) {
        req.logout();
        return res.send(500, new Error('req.employee is not set'));
    }

    /*
    sails.log.verbose('OwnerPolicy employee', req.employee);
    sails.log.verbose('OwnerPolicy method', req.method);
    sails.log.verbose('OwnerPolicy req.body', req.body);
    */

    if (req.options.modelDefinition.autoCreatedBy === false) {
        // sails.log.verbose('OwnerPolicy hasOwnershipPolicy: false');
        return next();
    }

    if ('POST' == req.method) {
        //req.body || (req.body = { });
        req.body.createdBy = req.employee.id;
        req.body.owner = req.employee.id;
    }

    //sails.log.verbose('OwnerPolicy req.model', req.model);
    next();
};
