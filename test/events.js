'use strict';

var request = require('supertest');
var should = require('should'); // eslint-disable-line no-unused-vars

var config = require('./app/config.js');
config.port = 7500;
var app = require('./app/app.js');
var appEvents = app(config);

describe('# event listeners', function() {

  before(function(done) {
    // create a user with verified email
    appEvents._adapter.save('event', 'event@email.com', 'password', function(err) {
      if (err) {console.log(err); }
      // verify email for event
      appEvents._adapter.find('name', 'event', function(error, user) {
        if (error) {console.log(error); }
        user.emailVerified = true;
        // save updated user to db
        appEvents._adapter.update(user, function(e) {
          if (e) {console.log(e); }
          done();
        });
      });
    });
  });

  describe('POST /forgot-password', function() {

    it('should emit a "forgot::sent" event', function(done) {
      appEvents._forgotPassword.on('forgot::sent', function(user) {
        user.name.should.equal('event');
        user.email.should.equal('event@email.com');
        done();
      });
      request(appEvents)
        .post('/forgot-password')
        .send({email: 'event@email.com'})
        .end(function(err, res) {
          if (err) {console.log(err); }
          res.statusCode.should.equal(200);
        });
    });

  });

  describe('POST /forgot-password/:token', function() {

    var token = '';

    // get token from db
    before(function(done) {
      appEvents._adapter.find('name', 'event', function(err, user) {
        if (err) {console.log(err); }
        token = user.pwdResetToken;
        done();
      });
    });

    it('should emit a "forgot::success" event', function(done) {
      appEvents._forgotPassword.removeAllListeners();
      appEvents._forgotPassword.on('forgot::success', function(user) {
        user.name.should.equal('event');
        user.email.should.equal('event@email.com');
        done();
      });
      request(appEvents)
        .post('/forgot-password/' + token)
        .send({password: 'new-password'})
        .end(function(err, res) {
          if (err) {console.log(err); }
          res.statusCode.should.equal(200);
        });
    });

  });

  after(function(done) {
    appEvents._adapter.remove('event', done);
  });

});
