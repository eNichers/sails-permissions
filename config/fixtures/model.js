var Promise = require('bluebird');
/**
 * Creates database representations of the Model types.
 *
 * @public
 */
exports.createModels = function () {
    sails.log.verbose('sails-permissions: syncing waterline models');

    var prefix = sails.config.permissions.controllersRoot;
    var startsWith = function (string, prefix) {
        return string.slice(0, prefix.length) == prefix;
    }
    var models = _.compact(_.map(sails.controllers, function (controller, name) {
        if(prefix && prefix.length > 0){
            if(!startsWith(name,prefix)){
                return false;
            }
        }
        var conf = controller._config,
            modelName = conf && conf.model && conf.model.name,                   
        return {
            name: name,
            identity: controller.identity,            
        };
    }));

    return Promise.map(models, function (model) {
        return Model.findOrCreate({
            name: model.name
        }, model);
    });
};
