var assert = require('assert');

describe('Permission Service', function() {

  it('should exist', function() {

    assert.ok(sails.services.permissionservice);
    assert.ok(global.PermissionService);

  });

  describe('#isForeignObject()', function() {

    it('should return true if object is not owned by the requesting admin', function(done) {

      var objectNotOwnedByAdmin = {
        owner: 2
      };
      var admin = 1;

      assert.equal(sails.services.permissionservice.isForeignObject(admin)(objectNotOwnedByAdmin), true);

      done();

    });

    it('should return false if object is owned by the requesting admin', function(done) {

      var objectOwnedByAdmin = {
        owner: 1
      };
      var admin = 1;

      assert.equal(sails.services.permissionservice.isForeignObject(admin)(objectOwnedByAdmin), false);

      done();
    });

  });

  describe('#hasForeignObjects()', function() {

    it('should return true if any object is not owned by the requesting admin', function(done) {

      var objectOwnedByAdmin = {
        owner: 1
      };
      var objectNotOwnedByAdmin = {
        owner: 2
      };
      var admin = {
        id: 1
      };

      assert.equal(sails.services.permissionservice.hasForeignObjects([objectNotOwnedByAdmin, objectOwnedByAdmin], admin), true);

      done();
    });

    it('should return false if all objects are owned by the requesting admin', function(done) {

      var objectOwnedByAdmin = {
        owner: 1
      };
      var objectOwnedByAdmin2 = {
        owner: 1
      };
      var admin = {
        id: 1
      };

      assert.equal(sails.services.permissionservice.hasForeignObjects([objectOwnedByAdmin2, objectOwnedByAdmin], admin), false);
      done();

    });

  });

  describe('#hasOwnershipPolicy()', function() {

    it('should return true if object supports ownership policy', function(done) {

      assert.equal(sails.services.permissionservice.hasOwnershipPolicy({
        autoCreatedBy: true
      }), true);
      done();
    });

    it('should return false if object does not support ownership policy', function(done) {

      assert.equal(sails.services.permissionservice.hasOwnershipPolicy({
        autoCreatedBy: false
      }), false);
      done();

    });

  });

  describe('#getMethod()', function() {

    it('should return \'create\' if POST request', function(done) {

      assert.equal(sails.services.permissionservice.getMethod('POST'), 'create');
      done();

    });

    it('should return \'update\' if PUT request', function(done) {

      assert.equal(sails.services.permissionservice.getMethod('PUT'), 'update');
      done();

    });

    it('should return \'read\' if GET request', function(done) {

      assert.equal(sails.services.permissionservice.getMethod('GET'), 'read');
      done();

    });

    it('should return \'delete\' if DELETE request', function(done) {

      assert.equal(sails.services.permissionservice.getMethod('DELETE'), 'delete');
      done();

    });

  });

  describe('#hasPassingCriteria()', function() {

    it('should return an array of items that don\'t match the given criteria', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          where: {
            x: 2
          }
        }
      }];
      assert.equal(sails.services.permissionservice.hasPassingCriteria(objects, permissions), false);
      done();
    });

    it('should return an array of items that don\'t match the given criteria, if the criteria has many values for the same key', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          where: {
            x: 2
          }
        }
      }, {
        criteria: {
          where: {
            x: 3
          }
        }
      }];
      assert.equal(sails.services.permissionservice.hasPassingCriteria(objects, permissions), false);
      done();
    });

    it('should return an array of items that don\'t match the given criteria, if the criteria has many values for the same key', function(done) {
      var objects = {
        x: 2
      };
      var permissions = [{
        criteria: {
          where: {
            x: 2
          }
        }
      }, {
        criteria: {
          where: {
            x: 3
          }
        }
      }];
      assert(sails.services.permissionservice.hasPassingCriteria(objects, permissions));
      done();
    });

    it('should return an empty array if there is no criteria', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      assert(sails.services.permissionservice.hasPassingCriteria(objects));
      done();
    });

    it('should match without where clause and blacklist', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          blacklist: ['x']
        }
      }];
      assert(sails.services.permissionservice.hasPassingCriteria(objects, permissions));
      done();
    });

    it('should match with where clause and attributes', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          where: {
            x: {
              '>': 0
            }
          },
          blacklist: ['y']
        }
      }];
      assert(sails.services.permissionservice.hasPassingCriteria(objects, permissions, {
        x: 5
      }));
      done();
    });

    it('should fail with bad where clause and good blacklist', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          where: {
            x: {
              '<': 0
            }
          },
          blacklist: ['y']
        }
      }];
      assert.equal(sails.services.permissionservice.hasPassingCriteria(objects, permissions, {
        x: 5
      }), false);
      done();
    });

    it('should fail with good where clause and bad blacklist', function(done) {
      var objects = [{
        x: 1
      }, {
        x: 2
      }, {
        x: 3
      }];
      var permissions = [{
        criteria: {
          where: {
            x: {
              '>': 0
            }
          },
          blacklist: ['x']
        }
      }];
      assert.equal(sails.services.permissionservice.hasPassingCriteria(objects, permissions, {
        x: 5
      }), false);
      done();
    });

  });

  describe('#hasUnpermittedAttributes', function() {
    it('should return true if any of the attributes are in the blacklist', function(done) {
      var attributes = {
        ok: 1,
        fine: 2
      };
      var blacklist = ["ok", "alright", "fine"];
      assert(sails.services.permissionservice.hasUnpermittedAttributes(attributes, blacklist));
      done();
    });

    it('should return true if any attributes are not permitted', function(done) {
      var attributes = {
        ok: 1,
        fine: 2,
        whatever: 3
      };
      var blacklist = ["ok", "alright", "fine"];
      assert(sails.services.permissionservice.hasUnpermittedAttributes(attributes, blacklist));
      done();
    });

    it('should return false if none of the keys are in the blacklist', function(done) {
      var attributes = {
        ok: 1,
        fine: 2,
        whatever: 3
      };
      var blacklist = ["notallowed"];
      assert.equal(sails.services.permissionservice.hasUnpermittedAttributes(attributes, blacklist), false);
      done();
    });

    it('should return false if there are no attributes', function(done) {
      var attributes = {};
      var blacklist = ["ok", "alright", "fine"];
      assert.equal(sails.services.permissionservice.hasUnpermittedAttributes(attributes, blacklist), false);
      done();
    });

    it('should return false if blacklist is empty', function(done) {
      var attributes = {
        ok: 1,
        fine: 2,
        whatever: 3
      };
      var blacklist = [];
      assert.equal(sails.services.permissionservice.hasUnpermittedAttributes(attributes, blacklist), false);
      done();
    });

  });

  describe('role and permission helpers', function() {
    it('should create a role', function(done) {
      // make sure there is no existing role with this name
      Role.find({
          name: 'fakeRole'
        })
        .then(function(role) {
          assert.equal(role.length, 0);
          // use the helper to create a new role
          var newRole = {
            name: 'fakeRole',
            permissions: [{
              model: 'Permission',
              action: 'delete',
              relation: 'role',
            }],
            admins: ['newadmin']
          };
          return sails.services.permissionservice.createRole(newRole);
        })
        .then(function(result) {
          // make sure the role exists now that we have created it
          return Role.findOne({
            name: 'fakeRole'
          });
        })
        .then(function(role) {
          assert(role && role.id);
        })
        .done(done, done);
    });

    it('should create a permission', function(done) {
      var permissionModelId;
      // find any existing permission for this action, and delete it
      Model.findOne({
          name: 'Permission'
        }).then(function(permissionModel) {
          permissionModelId = permissionModel.id;
          return Permission.destroy({
            action: 'create',
            model: permissionModelId,
            relation: 'role'
          });
        })
        .then(function(destroyed) {
          // make sure we actually destroyed it
          return Permission.find({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert.equal(permission.length, 0);
          // create a new permission
          var newPermissions = [{
            role: 'fakeRole',
            model: 'Permission',
            action: 'create',
            relation: 'role',
            criteria: {
              where: {
                x: 1
              },
              blacklist: ['y']
            }
          }, {
            role: 'fakeRole',
            model: 'Role',
            action: 'update',
            relation: 'role',
            criteria: {
              where: {
                x: 1
              },
              blacklist: ['y']
            }
          }];
          return sails.services.permissionservice.grant(newPermissions);
        })
        .then(function(perm) {
          // verify that it was created
          return Permission.findOne({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert(permission && permission.id);
        })
        .done(done, done);
    });


    it('should grant a permission directly to a admin', function(done) {
      var permissionModelId;
      // find any existing permission for this action, and delete it
      Model.findOne({
          name: 'Permission'
        }).then(function(permissionModel) {
          permissionModelId = permissionModel.id;
          return Permission.destroy({
            action: 'create',
            model: permissionModelId,
            relation: 'role'
          });
        })
        .then(function(destroyed) {
          // make sure we actually destroyed it
          return Permission.find({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert.equal(permission.length, 0);
          // create a new permission
          var newPermissions = [{
            admin: 'admin',
            model: 'Permission',
            action: 'create',
            relation: 'role',
            criteria: {
              where: {
                x: 1
              },
              blacklist: ['y']
            }
          }, {
            admin: 'admin',
            model: 'Role',
            action: 'update',
            relation: 'role',
            criteria: {
              where: {
                x: 1
              },
              blacklist: ['y']
            }
          }];
          return sails.services.permissionservice.grant(newPermissions);
        })
        .then(function(perm) {
          // verify that it was created
          return Permission.findOne({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert(permission && permission.id);
        })
        .done(done, done);
    });

    it('should revoke a permission', function(done) {
      var permissionModelId;

      // make sure there is already an existing permission for this case
      Model.findOne({
          name: 'Permission'
        }).then(function(permissionModel) {
          permissionModelId = permissionModel.id;
          return Permission.find({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert.equal(permission.length, 1);
          return sails.services.permissionservice.revoke({
            admin: 'admin',
            model: 'Permission',
            relation: 'role',
            action: 'create'
          });
        })
        .then(function() {
          return Permission.find({
            action: 'create',
            relation: 'role',
            model: permissionModelId
          });
        })
        .then(function(permission) {
          assert.equal(permission.length, 0);
        })
        .done(done, done);
    });

    it('should not revoke a permission if no admin or role is supplied', function(done) {
      var permissionModelId;
      var newPermissions = [{
        admin: 'admin',
        model: 'Permission',
        action: 'create',
        relation: 'role',
        criteria: {
          where: {
            x: 1
          },
          blacklist: ['y']
        }
      }, {
        admin: 'admin',
        model: 'Role',
        action: 'update',
        relation: 'role',
        criteria: {
          where: {
            x: 1
          },
          blacklist: ['y']
        }
      }];

      return sails.services.permissionservice.grant(newPermissions)
        .then(function() {
          // make sure there is already an existing permission for this case
          Model.findOne({
              name: 'Permission'
            }).then(function(permissionModel) {
              permissionModelId = permissionModel.id;
              return Permission.find({
                action: 'create',
                relation: 'role',
                model: permissionModelId
              });
            })
            .then(function(permission) {
              assert.equal(permission.length, 1);
              return sails.services.permissionservice.revoke({
                model: 'Permission',
                relation: 'role',
                action: 'create'
              });
            })
            .catch(function(err) {
              assert.equal(err.message, 'You must provide either a admin or role to revoke the permission from');
            })
            .then(function() {
              return Permission.find({
                action: 'create',
                relation: 'role',
                model: permissionModelId
              });
            })
            .then(function(permission) {
              assert.equal(permission.length, 1);
            })
            .done(done, done);
        });
    });

    it('should remove admins from a role', function(done) {
      var admin;
      var ok = Admin.create({
        adminName: 'test'
      });

      ok = ok.then(function(usr) {
        admin = usr;
        return PermissionService.addAdminsToRole('test', 'admin');
      });

      ok = ok.then(function (role) {
        assert(_.contains(_.pluck(role.admins, 'id'), admin.id));
        return PermissionService.removeAdminsFromRole('test', 'admin');
      });

      ok = ok.then(function (role) {
        assert(!_.contains(_.pluck(role.admins, 'id'), admin.id));
      })
      .done(done, done);

    });

  });
  //TODO: add unit tests for #findTargetObjects()

  //TODO: add unit tests for #findModelPermissions()

});
