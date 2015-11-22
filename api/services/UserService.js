var anonymousEmployee = null;

module.exports = {

    findAnonymousEmployee: function (cb) {
        if (anonymousEmployee) {
            cb(anonymousEmployee);
        }
        else {
            Employee.findOne({
                    employeeName: sails.config.permissions.anonymousEmployeename
                })
                .then(function (employee) {
                    anonymousEmployee = employee;
                    cb(employee);
                });
        }
    }

}
