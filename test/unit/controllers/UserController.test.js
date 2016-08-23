var assert = require('assert');
var request = require('supertest');
var _ = require('lodash');

var adminAuth = {
  Authorization: 'Basic YWRtaW5AZXhhbXBsZS5jb206YWRtaW4xMjM0'
};
var registeredAuth = {
  Authorization: 'Basic bmV3dXNlcjp1c2VyMTIzNA=='
};
var newAdminAuth = {
  Authorization: 'Basic bmV3dXNlcjp1c2VyMTIzNA=='
};

describe('Admin Controller', function() {

  var adminId;
  var newAdminId;
  var roleId;
  var inactiveRoleId;

  describe('Admin with Admin Role', function() {

    describe('#find()', function() {

      it('should be able to read all admins', function(done) {

        request(sails.hooks.http.app)
          .get('/admin')
          .set('Authorization', adminAuth.Authorization)
          .expect(200)
          .end(function(err, res) {

            var admins = res.body;

            assert.ifError(err);
            assert.ifError(admins.error);
            assert.equal(admins[0].adminName, 'admin');
            adminId = admins[0].id;

            done(err);

          });
      });

      it('should be able to remove a admin from a role', function(done) {
        var ok = Role.find({
          name: 'registered'
        });

        ok.then(function(role) {
            request(sails.hooks.http.app)
              .post('/admin')
              .set('Authorization', adminAuth.Authorization)
              .send({
                adminName: 'abouttoberemovedadmin',
                email: 'abouttoberemovedadmin@example.com',
                password: 'admin1234'
              })
              .expect(200)
              .end(function(err, res) {

                assert.ifError(err);
                var admin = res.body;
                Role.findOne({
                    name: 'registered'
                  }).populate('admins', {
                    id: admin.id
                  })
                  .then(function(role) {
                    assert.equal(admin.adminName, 'abouttoberemovedadmin');
                    assert(_.contains(_.pluck(role.admins, 'id'), admin.id));

                    request(sails.hooks.http.app)
                      .delete('/role/' + role.id + '/admins/' + admin.id)
                      .set('Authorization', adminAuth.Authorization)
                      .expect(200)
                      .end(function(err, res) {
                        // the admin id should not be in the list anymore
                        assert(!_.includes(_.pluck(res.admins, 'id'), admin.id));
                        done();
                      });
                  });

              });
          })
          .catch(done);

      });

    });

    describe('#create()', function() {

      it('should be able to create a new admin', function(done) {

        request(sails.hooks.http.app)
          .post('/admin')
          .set('Authorization', adminAuth.Authorization)
          .send({
            adminName: 'newadmin',
            email: 'newadmin@example.com',
            password: 'admin1234'
          })
          .expect(200)
          .end(function(err, res) {

            var admin = res.body;

            assert.ifError(err);
            assert.ifError(admin.error);
            assert.equal(admin.adminName, 'newadmin');
            newAdminId = admin.id;

            done(err);

          });

      });

      it('should return an error if a admin already exists', function(done) {

        request(sails.hooks.http.app)
          .post('/admin')
          .set('Authorization', adminAuth.Authorization)
          .send({
            adminName: 'newadmin',
            email: 'newadmin@example.com',
            password: 'admin1234'
          })
          .expect(400)
          .end(function(err) {
            done(err);
          });

      });

      it('should be able to create a new role, and assign a new admin to it', function(done) {

        request(sails.hooks.http.app)
          .post('/role')
          .set('Authorization', adminAuth.Authorization)
          .send({
            name: 'testrole',
            admins: [newAdminId]
          })
          .expect(201)
          .end(function(err, res) {
            roleId = res.body.id; // 4
            done(err);
          });
      });

      it('should be able to create a new permission for updating active roles', function(done) {
        request(sails.hooks.http.app)
          .get('/model?name=role')
          .set('Authorization', adminAuth.Authorization)
          .expect(200)
          .end(function(err, res) {

            // haha roleModel
            var roleModel = res.body[0];

            request(sails.hooks.http.app)
              .post('/permission')
              .set('Authorization', adminAuth.Authorization)
              .send({
                model: roleModel.id,
                action: 'update',
                role: roleId,
                createdBy: adminId,
                criteria: {
                  blacklist: ['id', 'stream'],
                  where: {
                    active: true
                  }
                }
              })
              .expect(201)
              .end(function(err, res) {
                done(err);
              });

          });
      });

      it('should be able to create a new permission for updating owned roles', function(done) {
        request(sails.hooks.http.app)
          .get('/model?name=role')
          .set('Authorization', adminAuth.Authorization)
          .expect(200)
          .end(function(err, res) {

            // haha roleModel
            var roleModel = res.body[0];

            request(sails.hooks.http.app)
              .post('/permission')
              .set('Authorization', adminAuth.Authorization)
              .send({
                model: roleModel.id,
                action: 'update',
                role: roleId,
                createdBy: adminId,
                criteria: {
                  blacklist: ['id']
                },
                relation: 'owner'
              })
              .expect(201)
              .end(function(err, res) {
                done(err);
              });

          });
      });

      it('should be able to create a new role and set it as inactive', function(done) {
        request(sails.hooks.http.app)
          .post('/role')
          .set('Authorization', adminAuth.Authorization)
          .send({
            name: 'inactiveRole',
            admins: [newAdminId],
            active: false
          })
          .expect(201)
          .end(function(err, res) {
            inactiveRoleId = res.body.id;
            done(err);
          });
      });

      it('should be able to create a read permission with a where clause for roles and a blacklist', function(done) {

        request(sails.hooks.http.app)
          .get('/model?name=role')
          .set('Authorization', adminAuth.Authorization)
          .expect(200)
          .end(function(err, res) {

            // haha roleModel
            var roleModel = res.body[0];

            request(sails.hooks.http.app)
              .post('/permission')
              .set('Authorization', adminAuth.Authorization)
              .send({
                model: roleModel.id,
                action: 'read',
                role: roleId,
                createdBy: adminId,
                criteria: {
                  where: {
                    active: true
                  },
                  blacklist: ['name', 'createdAt']
                }
              })
              .expect(201)
              .end(function(err, res) {
                done(err);
              });
          });
      });

      it('should be able to create a read permission with a where clause for a role that should filter out all results', function(done) {

        request(sails.hooks.http.app)
          .get('/model?name=permission')
          .set('Authorization', adminAuth.Authorization)
          .expect(200)
          .end(function(err, res) {

            var permissionModel = res.body[0];

            request(sails.hooks.http.app)
              .post('/permission')
              .set('Authorization', adminAuth.Authorization)
              .send({
                model: permissionModel.id,
                action: 'read',
                role: roleId,
                createdBy: adminId,
                criteria: {
                  where: {
                    id: {
                      '>': 99999
                    }
                  }
                }
              })
              .expect(201)
              .end(function(err, res) {
                done(err);
              });
          });
      });

    });


  });

  describe('Admin with Registered Role', function() {

    describe('#create()', function() {

      it('should not be able to create a new admin', function(done) {

        request(sails.hooks.http.app)
          .post('/admin')
          .set('Authorization', registeredAuth.Authorization)
          .send({
            adminName: 'newadmin1',
            email: 'newadmin1@example.com',
            password: 'lalalal1234'
          })
          .expect(403)
          .end(function(err, res) {

            var admin = res.body;

            assert.ifError(err);
            assert(_.isString(admin.error), JSON.stringify(admin));

            done(err);

          });

      });

    });

    describe('#update()', function() {

      it('should be able to update themselves', function(done) {

        request(sails.hooks.http.app)
          .put('/admin/' + newAdminId)
          .set('Authorization', registeredAuth.Authorization)
          .send({
            email: 'newadminupdated@example.com'
          })
          .expect(200)
          .end(function(err, res) {

            var admin = res.body;

            assert.ifError(err);
            assert.equal(admin.email, 'newadminupdated@example.com');

            done(err);

          });

      });

      it('should be able to update role name', function(done) {
        // it should be able to do this, because an earlier test set up the role and permission for it
        request(sails.hooks.http.app)
          .put('/role/' + roleId)
          .set('Authorization', newAdminAuth.Authorization)
          .send({
            name: 'updatedName'
          })
          .expect(200)
          .end(function(err, res) {
            assert.ifError(err);
            assert.equal(res.body.name, 'updatedName');
            done(err);

          });

      });

      it('should not be able to update role id', function(done) {
        // it should be able to do this, because an earlier test set up the role and permission for it
        request(sails.hooks.http.app)
          .put('/role/' + roleId)
          .set('Authorization', newAdminAuth.Authorization)
          .send({
            id: 99
          })
          .expect(403)
          .end(function(err, res) {
            assert(res.body.hasOwnProperty('error'));
            assert.ifError(err);
            done(err);

          });

      });

      it('should not be able to update role name when role is inactive', function(done) {
        // attribute is ok but where clause fails
        request(sails.hooks.http.app)
          .put('/role/' + inactiveRoleId)
          .set('Authorization', newAdminAuth.Authorization)
          .send({
            name: 'updatedInactiveName'
          })
          .expect(403)
          .end(function(err, res) {
            assert(res.body.hasOwnProperty('error'));
            assert.ifError(err);
            done(err);

          });
      });


      // this test depends on a previous test that set a permission with a particular where clause/blacklist
      it('should read only active roles, and should not have blacklisted attributes', function(done) {

        request(sails.hooks.http.app)
          .get('/role')
          .set('Authorization', newAdminAuth.Authorization)
          .send({
            name: 'updatedInactiveName'
          })
          .expect(200)
          .end(function(err, res) {
            res.body.forEach(function(role) {
              assert(!role.hasOwnProperty('name'));
              assert(!role.hasOwnProperty('createdAt'));
              assert(role.active);
            });
            done(err);

          });
      });

      it.skip('should have filtered out all of the permissions results', function(done) {

        request(sails.hooks.http.app)
          .get('/permission')
          .set('Authorization', newAdminAuth.Authorization)
          .send({
            name: 'updatedInactiveName'
          })
          .expect(404)
          .end(function(err, res) {
            done(err);
          });
      });

      it('should not be able to update another admin', function(done) {

        request(sails.hooks.http.app)
          .put('/admin/' + adminId)
          .set('Authorization', registeredAuth.Authorization)
          .send({
            email: 'crapadminemail@example.com'
          })
          .expect(403)
          .end(function(err, res) {

            var admin = res.body;

            assert.ifError(err);
            assert(_.isString(admin.error), JSON.stringify(admin));

            done(err);

          });

      });


      it('should not be able to read another admin', function(done) {

        request(sails.hooks.http.app)
          .get('/admin/' + adminId)
          .set('Authorization', registeredAuth.Authorization)
          .expect(403)
          .end(function(err, res) {
            var admin = res.body;

            assert.ifError(err);
            assert(_.isString(admin.error), JSON.stringify(admin));

            done(err);

          });

      });

      it('should not be able to read all admins', function(done) {

        request(sails.hooks.http.app)
          .get('/admin/')
          .set('Authorization', registeredAuth.Authorization)
          .expect(200)
          .end(function(err, res) {
            var admins = res.body;

            assert.ifError(err);
            assert(admins.length == 1);

            done(err);

          });

      });

    });

  });

});
