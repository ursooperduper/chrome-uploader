/**
 * Copyright (c) 2014, Tidepool Project
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the associated License, which is identical to the BSD 2-Clause
 * License as published by the Open Source Initiative at opensource.org.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the License for more details.
 *
 * You should have received a copy of the License along with this program; if
 * not, you can obtain one from Tidepool Project at tidepool.org.
 */

var localStore = require('./localStore');

// Wrapper around the Tidepool client library
var createTidepoolClient = require('tidepool-platform-client');
var tidepool;

var config = require('../config');

var api = {
  log: console.log.bind(console)
};

// ----- Api Setup -----

api.init = function(cb) {
  var myLog = { info: console.log.bind(console), warn: console.log.bind(console) };

  tidepool = createTidepoolClient({
    host: config.API_URL,
    uploadApi: config.UPLOAD_URL,
    log: myLog,
    localStore: localStore,
    metricsSource: 'chrome-uploader',
    metricsVersion: 'chrome-uploader-beta'
  });

  api.tidepool = tidepool;

  tidepool.initialize(cb);
};

// ----- User -----

api.user = {};

api.user.login = function(user, options, cb) {
  api.log('POST /auth/login');

  tidepool.login(user, options, function(err, data) {
    if (err) {
      return cb(err);
    }
    return cb(null, data);
  });
};

api.user.account = function(cb) {
  api.log('GET /auth/user');
  tidepool.getCurrentUser(cb);
};

api.user.profile = function(cb) {
  api.log('GET /metadata/' + tidepool.getUserId() + '/profile');
  tidepool.findProfile(tidepool.getUserId(), function(err, profile) {
      if (err) {
        return cb(err);
      }
      return cb(null, profile);
  });
};

api.user.logout = function(cb) {
  api.log('POST /auth/logout');
  tidepool.logout(cb);
};

// ----- Upload -----

api.upload = {};

api.upload.accounts = function(happyCb, sadCb) {
  //TODO: check this method out
  api.log('GET /access/groups/'+tidepool.getUserId());
  tidepool.getViewableUsers(tidepool.getUserId(),function(err, data) {
    if(err){
      return sadCb(err,err);
    }
    return happyCb(data, 'upload accounts found');
  });
};

api.upload.toPlatform = function(data, happyCb, sadCb) {
  //off to jellyfish we go
  api.log('POST /data');
  tidepool.uploadDeviceDataForUser(data, function(err, result) {
    if(err){
      return sadCb(err,err);
    }
    return happyCb(result, 'upload accounts found');
  });
};

// ----- Metrics -----

api.metrics = {};

api.metrics.track = function(eventName, properties, cb) {
  api.log('GET /metrics/' + window.encodeURIComponent(eventName));
  return tidepool.trackMetric(eventName, properties, cb);
};

// ----- Errors -----

api.errors = {};

api.errors.log = function(error, message, properties) {
  api.log('POST /errors');
  return tidepool.logAppError(error, message, properties);
};

module.exports = api;