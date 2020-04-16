/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

const assert = require("assert");
const helper = require("../helper.js");

let configuration = {
	serviceName: "urac"
};

let req = {
	headers: {
		"x-forwarded-proto": "http",
		"host": "dashboard-api.soajs.org",
		"x-nginx-proxy": "true",
		"content-length": "66",
		"accept": "*/*",
		"origin": "http://dashboard.soajs.org",
		"authorization": "Basic NTU1MWFjYTllMTc5YzM5Yjc2MGY3YTFhOnNoaGggdGhpcyBpcyBhIHNlY3JldA==",
		"key": "d44dfaaf1a3ba93adc6b3368816188f96134dfedec7072542eb3d84ec3e3d260f639954b8c0bc51e742c1dff3f80710e3e728edb004dce78d82d7ecd5e17e88c39fef78aa29aa2ed19ed0ca9011d75d9fc441a3c59845ebcf11f9393d5962549",
		"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
		"content-type": "application/json",
		"referer": "http://dashboard.soajs.org/",
		"accept-encoding": "gzip, deflate",
		"accept-language": "en-US,en;q=0.8,ar;q=0.6",
		"soajsinjectobj": "{\"tenant\":{\"id\":\"5551aca9e179c39b760f7a1a\",\"code\":\"DBTN\"},\"key\":{\"config\":{\"mail\":{\"from\":\"soajstest@soajs.org\",\"transport\":{\"type\":\"smtp\",\"options\":{\"host\":\"secure.emailsrvr.com\",\"port\":\"587\",\"ignoreTLS\":true,\"secure\":false,\"auth\":{\"user\":\"soajstest@soajs.org\",\"pass\":\"p@ssw0rd\"}}}},\"oauth\":{\"loginMode\":\"urac\"}},\"iKey\":\"38145c67717c73d3febd16df38abf311\",\"eKey\":\"d44dfaaf1a3ba93adc6b3368816188f96134dfedec7072542eb3d84ec3e3d260f639954b8c0bc51e742c1dff3f80710e3e728edb004dce78d82d7ecd5e17e88c39fef78aa29aa2ed19ed0ca9011d75d9fc441a3c59845ebcf11f9393d5962549\"},\"application\":{\"product\":\"DSBRD\",\"package\":\"DSBRD_MAIN\",\"appId\":\"5512926a7a1f0e2123f638de\"},\"package\":{},\"device\":\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36\",\"geo\":{\"ip\":\"127.0.0.1\"},\"awareness\":{\"host\":\"127.0.0.1\",\"port\":4000},\"urac\":{\"_id\": \"59a538becc083eecf37149df\", \"username\": \"owner\", \"firstName\": \"owner\", \"lastName\": \"owner\", \"email\": \"owner@soajs.org\", \"groups\": [ \"owner\" ], \"tenant\": { \"id\":\"5551aca9e179c39b760f7a1a\", \"code\": \"DBTN\" },\"profile\": {},\"acl\": null, \"acl_AllEnv\": null},\"param\":{\"id\":\"5551aca9e179c39b760f7a1a\"}}",
		"cookie": "",
		"connection": "close"
	}
};

let res = {};

let soajsMW = helper.requireModule("index.js");
let mock = require('./mimic_gateway.js');
let mock_config = null;
describe("testing MW", function () {
	
	before(function (done) {
		mock.startServer(null, function (_config) {
			mock_config = _config;
			done();
		});
	});
	
	it("Request with soajs obj", function (done) {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
		process.env.SOAJS_DEPLOY_MANUAL = '1';
		let functionMw = soajsMW(configuration);
		// Wait for registry to load and object is populated
		setTimeout(function () {
			let specialRequest = {
				soajs: {},
				headers: {}
			};
			functionMw(specialRequest, res, function () {
				delete process.env.SOAJS_REGISTRY_API;
				delete process.env.SOAJS_DEPLOY_MANUAL;
				done();
			});
		}, 2000);
	});
	
	it("Request with wrong SOAJS_REGISTRY_API", function (done) {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1xxx5000';
		process.env.SOAJS_DEPLOY_MANUAL = '1';
		soajsMW(configuration, (err, reg) => {
			assert.ok(err);
			assert.equal(err.message, "Invalid format for SOAJS_REGISTRY_API [hostname:port]: 127.0.0.1xxx5000");
			assert.equal(reg, null);
			delete process.env.SOAJS_REGISTRY_API;
			delete process.env.SOAJS_DEPLOY_MANUAL;
			done();
		});
	});
	
	it("Request with wrong SOAJS_REGISTRY_API port number", function (done) {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:xxx';
		process.env.SOAJS_DEPLOY_MANUAL = '1';
		soajsMW(configuration, (err, reg) => {
			assert.ok(err);
			assert.equal(err.message, "port must be integer: [xxx]");
			assert.equal(reg, null);
			delete process.env.SOAJS_REGISTRY_API;
			delete process.env.SOAJS_DEPLOY_MANUAL;
			done();
		});
	});
	
	it("Test all registry methods", function (done) {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
		let functionMw = soajsMW(configuration);
		// Wait for registry to load and object is populated
		setTimeout(function () {
			functionMw(req, res, function () {
				let response = req.soajs.reg.getDatabases();
				assert.ok(response);
				response = req.soajs.reg.getDatabases("provision");
				assert.ok(response);
				response = req.soajs.reg.getDatabases("urac");
				assert.ok(response);
				response = req.soajs.reg.getServiceConfig();
				assert.ok(response);
				response = req.soajs.reg.getDeployer();
				assert.ok(response);
				response = req.soajs.reg.getCustom();
				assert.ok(response);
				response = req.soajs.reg.getResources();
				assert.ok(response);
				response = req.soajs.reg.getResources("cluster");
				assert.ok(response);
				response = req.soajs.reg.getServices();
				assert.ok(response);
				response = req.soajs.reg.getServices("urac");
				assert.ok(response);
				response = req.soajs.reg.getDaemons();
				assert.ok(response);
				response = req.soajs.reg.getDaemons("onedaemon");
				assert.ok(response);
				
				req.soajs.reg.reload(function () {
					delete process.env.SOAJS_REGISTRY_API;
					done();
				});
			});
		}, 2000);
	});
	
	it("Test awareness getHost", function (done) {
		process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
		let functionMw = soajsMW(configuration);
		// Wait for registry to load and object is populated
		setTimeout(function () {
			functionMw(req, res, function () {
				req.soajs.awareness.getHost("urac", function (host) {
					assert.equal(host, "127.0.0.1:4000/urac");
					req.soajs.awareness.getHost("urac", 2.0, function (host) {
						assert.equal(host, "127.0.0.1:4000/urac/v2");
						req.soajs.awareness.getHost(function (host) {
							delete process.env.SOAJS_REGISTRY_API;
							assert.equal(host, "127.0.0.1:4000");
							done();
						});
					});
				});
			});
		}, 2000);
	});
	
	it("Test awareness connect", function (done) {
		done();
	});
	
	after(function (done) {
		mock.killServer(mock_config, function () {
			done();
		});
	});
});