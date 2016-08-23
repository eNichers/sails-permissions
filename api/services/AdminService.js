var anonymousAdmin = null;

module.exports = {

    findAnonymousAdmin: function (cb) {
        if (anonymousAdmin) {
            cb(anonymousAdmin);
        }
        else {
            Admin.findOne({
                    adminName: sails.config.permissions.anonymousAdminname
                })
                .then(function (admin) {
                    anonymousAdmin = admin;
                    cb(admin);
                });
        }
    }

}
