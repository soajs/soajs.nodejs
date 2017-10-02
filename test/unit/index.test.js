"use strict";
var assert = require("assert");

var helper = require("../helper.js");

var configuration = {
	serviceName : "test"
};

var req = {
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

var res = {};

describe("testing index", function () {
	
	describe("testing index", function () {
		
		it("Request with soajs obj", function (done) {
			process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
			
			var soajsMW = helper.requireModule("index");
			
			var functionMw = soajsMW(configuration);
			
			var specialRequest = {
				soajs : {},
				headers : {}
			};
			
			functionMw(specialRequest, res, function (error) {
				delete process.env.SOAJS_REGISTRY_API;
				done();
			});
		});
		
		it("Request with wrong SOAJS_REGISTRY_API", function (done) {
			process.env.SOAJS_REGISTRY_API = '127.0.0.1xxx5000';
			
			var soajsMW = helper.requireModule("index");
			
			var functionMw = soajsMW(configuration);
			
			var specialRequest = {
				soajs : {},
				headers : {}
			};
			
			functionMw(specialRequest, res, function (error) {
				delete process.env.SOAJS_REGISTRY_API;
				done();
			});
		});
		
		it("Request with wrong SOAJS_REGISTRY_API port number", function (done) {
			process.env.SOAJS_REGISTRY_API = '127.0.0.1:xxx';
			
			var soajsMW = helper.requireModule("index");
			
			var functionMw = soajsMW(configuration);
			
			var specialRequest = {
				soajs : {},
				headers : {}
			};
			
			functionMw(specialRequest, res, function (error) {
				delete process.env.SOAJS_REGISTRY_API;
				done();
			});
		});
		
		it("Undefined registry - controller off", function (done) {
			process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
			
			var soajsMW = helper.requireModule("index");
			
			var functionMw = soajsMW(configuration);
			
			functionMw(req, res, function (error) {
				req.soajs.reg.getDatabases();
				req.soajs.reg.getServiceConfig();
				req.soajs.reg.getDeployer();
				req.soajs.reg.getCustom();
				req.soajs.reg.getResources();
				req.soajs.reg.getServices();
				req.soajs.reg.getDaemons();
				
				req.soajs.reg.reload(function(output){
					delete process.env.SOAJS_REGISTRY_API;
					done();
				});
			});
		});
		
		it("Undefined registry - controller off - get Host", function (done) {
			
			process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
			
			var soajsMW = helper.requireModule("index");
			
			var functionMw = soajsMW(configuration);
			
			functionMw(req, res, function (error) {
				req.soajs.awareness.getHost("serviceName",function(){});
				req.soajs.awareness.getHost("serviceName",2.0,function(){});
				req.soajs.awareness.getHost("serviceName",2.0,null,function(){});
				
				req.soajs.awareness.getHost(function(host){});
				
				delete process.env.SOAJS_REGISTRY_API;
				done();
			});
		});
		
		it("Turn on the controller and get registry", function (done) {
			
			var controller = require("soajs.controller");
			
			setTimeout(function () {
				
				// set this env var after turning the controller on
				process.env.SOAJS_REGISTRY_API = '127.0.0.1:5000';
				
				var soajsMW = helper.requireModule("index");
				
				var functionMw = soajsMW(configuration);
				
				functionMw(req, res, function (error) {
					
					// wait for the registry to be set
					setTimeout(function () {
						req.soajs.reg.getDatabases();
						req.soajs.reg.getDatabases("urac");
						req.soajs.reg.getDatabases("notfound");
						req.soajs.reg.getServiceConfig();
						req.soajs.reg.getDeployer();
						req.soajs.reg.getCustom();
						req.soajs.reg.getResources();
						req.soajs.reg.getResources("whatever");
						req.soajs.reg.getServices();
						req.soajs.reg.getServices("whatever");
						req.soajs.reg.getDaemons();
						req.soajs.reg.getDaemons("whatever");
						
						req.soajs.reg.reload(function(output){
							
							// let it auto reload once
							setTimeout(function () {
								done();
							},1500); // set in mongo script for one second!
						});
					},500);
				});
			}, 1000);
		});
		
	});
});