/**
 * Creates database representations of the Model types.
 *
 * @public
 */
import _ from 'lodash'
exports.createModels = function () {
    sails.log.verbose('sails-permissions: syncing waterline models');

    var prefix = sails.config.permissions.controllersRoot;
    var startsWith = function (string, prefix) {
        return prefix.length < string.length ?
            (string.slice(0, prefix.length) == prefix) : (prefix.slice(0, string.length) == string);
    }
    var models = _.compact(_.map(sails.controllers, function (controller, name) {
        if(prefix && prefix.length > 0){
            if(!startsWith(name,prefix)){
                return false;
            }
        }
        var conf = controller._config;

        return {
            name: name,
            identity: controller.identity            
        };
    }));

    return Promise.all(_.map(models, function (model) {
        return sails.models.model.findOrCreate({ name: model.name }, model);
        /// return Model.findOrCreate({
        //     name: model.name
        // }, model);
    }));
};
