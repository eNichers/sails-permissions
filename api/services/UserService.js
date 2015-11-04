var anonymousUser = null;

module.exports = {

    findAnonymousUser: function (cb) {
        if (anonymousUser) {
            cb(anonymousUser);
        }
        else {
            User.findOne({
                    username: sails.config.permissions.anonymousUsername
                })
                .then(function (user) {
                    anonymousUser = user;
                    cb(user);
                });
        }
    }

}
