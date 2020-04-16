"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const request = require("request");
const assert = require('assert');

describe("starting integration tests", () => {
	
	let service = require('./service.js');
	let mock = require('./mimic_gateway.js');
	let data = require('./data.js');
	let mock_config = null;
	
	before((done) => {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
		process.env.SOAJS_DEPLOY_MANUAL = '1';
		mock.startServer(null, function (_config) {
			mock_config = _config;
			setTimeout(function () {
				service.startServer(() => {
					setTimeout(function () {
						done();
					}, 1000);
				});
			}, 1000);
		});
	});
	
	it("Test injectedObject data population", (done) => {
		let options = {
			"uri": "http://127.0.0.1:4381/hello",
			"headers": data.headers,
			"json": true
		};
		request.get(options, function (error, response, body) {
			assert.ifError(error);
			assert.ok(body);
			assert.equal(body.tenant.id, "5551aca9e179c39b760f7a1a");
			assert.equal(body.urac._id, "59a538becc083eecf37149df");
			done();
		});
	});
	it("Test /mix/test", (done) => {
		let options = {
			"uri": "http://127.0.0.1:4381/mix/test",
			"headers": data.headers,
			"json": true
		};
		request.get(options, function (error, response, body) {
			assert.ifError(error);
			assert.ok(body);
			assert.equal(body.controller, "127.0.0.1:4000");
			assert.equal(body.databases.urac.cluster, "dash_cluster");
			done();
		});
	});
	it("Test /connect/tests", (done) => {
		process.env.SOAJS_DEPLOY_HA = "kubernetes";
		let options = {
			"uri": "http://127.0.0.1:4381/connect/tests",
			"headers": data.headers,
			"json": true,
			"qs": data.query
		};
		request.get(options, function (error, response, body) {
			assert.ifError(error);
			assert.ok(body);
			
			assert.equal(body.test1.host, '127.0.0.1:4000/urac/v2');
			assert.ok(body.test1.headers.key);
			assert.ok(body.test1.headers.access_token);
			
			assert.equal(body.test2.host, '127.0.0.2:4001');
			assert.ok(body.test2.headers.soajsinjectobj);
			
			assert.equal(body.test3.host, '127.0.0.1:4000');
			assert.ok(body.test3.headers.key);
			assert.ok(body.test1.headers.access_token);
			
			assert.equal(body.test4.host, '127.0.0.2:4001');
			assert.ok(body.test4.headers.soajsinjectobj);
			
			done();
		});
	});
	
	after(function (done) {
		delete process.env.SOAJS_REGISTRY_API;
		delete process.env.SOAJS_DEPLOY_MANUAL;
		delete process.env.SOAJS_DEPLOY_HA;
		service.killServer(function () {
			mock.killServer(mock_config, function () {
				done();
			});
		});
	});
});