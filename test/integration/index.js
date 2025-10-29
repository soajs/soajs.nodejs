"use strict";

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const axios = require("axios");
const assert = require('assert');

describe("starting integration tests", () => {
	
	let service = require('./service.js');
	let mock = require('./mimic_gateway.js');
	let data = require('./data.js');
	let mock_config = null;
	
	before((done) => {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:5001';
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
		axios.get("http://127.0.0.1:4381/hello", {
			headers: data.headers
		})
		.then((response) => {
			assert.ok(response.data);
			assert.equal(response.data.tenant.id, "5551aca9e179c39b760f7a1a");
			assert.equal(response.data.urac._id, "59a538becc083eecf37149df");
			done();
		})
		.catch((error) => {
			done(error);
		});
	});
	it("Test /mix/test", (done) => {
		axios.get("http://127.0.0.1:4381/mix/test", {
			headers: data.headers
		})
		.then((response) => {
			assert.ok(response.data);
			assert.equal(response.data.controller, "127.0.0.1:4000");
			assert.equal(response.data.databases.urac.cluster, "dash_cluster");
			done();
		})
		.catch((error) => {
			done(error);
		});
	});
	it("Test /connect/tests", (done) => {
		process.env.SOAJS_DEPLOY_HA = "kubernetes";
		axios.get("http://127.0.0.1:4381/connect/tests", {
			headers: data.headers,
			params: data.query
		})
		.then((response) => {
			assert.ok(response.data);

			assert.equal(response.data.test1.host, '127.0.0.1:4000/urac/v2');
			assert.ok(response.data.test1.headers.key);
			assert.ok(response.data.test1.headers.access_token);

			assert.equal(response.data.test2.host, '127.0.0.2:4001');
			assert.ok(response.data.test2.headers.soajsinjectobj);

			assert.equal(response.data.test3.host, '127.0.0.1:4000');
			assert.ok(response.data.test3.headers.key);
			assert.ok(response.data.test1.headers.access_token);

			assert.equal(response.data.test4.host, '127.0.0.2:4001');
			assert.ok(response.data.test4.headers.soajsinjectobj);

			done();
		})
		.catch((error) => {
			done(error);
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