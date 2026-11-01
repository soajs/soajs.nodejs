/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

"use strict";

const assert = require("assert");
const fs = require("fs");
const helper = require("../helper.js");
const soajs = helper.requireModule("index.js");

let call = (handler, req, cb) => {
	let res = {
		headers: {},
		setHeader: (name, value) => {
			res.headers[name] = value;
		},
		end: (body) => {
			cb(res.statusCode, res.headers, JSON.parse(body));
		}
	};
	handler(req, res, () => {
		cb(null, null, null);
	});
};

describe("Unit test for: GET /mcp/tools", () => {

	it("Success - a YAML file is sent as text", (done) => {
		let handler = soajs.mcpTools({
			serviceName: "express",
			serviceVersion: 2,
			swaggerFilename: "/test/data/swagger.yml"
		});
		call(handler, {method: "GET", url: "/mcp/tools", headers: {}}, (status, headers, body) => {
			assert.equal(status, 200);
			assert.equal(headers["Content-Type"], "application/json");
			assert.equal(body.result, true);
			assert.equal(body.service.route, "/mcp/tools");
			assert.deepEqual(body.data, {
				name: "express",
				version: "2",
				swagger: fs.readFileSync(process.cwd() + "/test/data/swagger.yml", "utf8")
			});
			done();
		});
	});

	it("Success - a JSON file is sent parsed", (done) => {
		let handler = soajs.mcpTools({serviceName: "express", swaggerFilename: "/test/integration/swagger.json"});
		call(handler, {method: "GET", url: "/mcp/tools", headers: {}}, (status, headers, body) => {
			assert.equal(body.data.version, "1");
			assert.deepEqual(body.data.swagger, require("../integration/swagger.json"));
			done();
		});
	});

	it("Success - swaggerDocument wins over the file", (done) => {
		let doc = {openapi: "3.0.0", paths: {}};
		let handler = soajs.mcpTools({serviceName: "express", swaggerDocument: doc, swaggerFilename: "/test/data/swagger.yml"});
		call(handler, {method: "GET", url: "/mcp/tools", headers: {}}, (status, headers, body) => {
			assert.deepEqual(body.data.swagger, doc);
			done();
		});
	});

	it("Success - no document gives no tools", (done) => {
		let handler = soajs.mcpTools({serviceName: "express", swaggerFilename: "/test/data/missing.yml"});
		call(handler, {method: "GET", url: "/mcp/tools", headers: {}}, (status, headers, body) => {
			assert.deepEqual(body.data, {name: "express", version: "1", tools: []});
			done();
		});
	});

	it("Success - an invalid JSON file gives no tools", (done) => {
		let handler = soajs.mcpTools({serviceName: "express", swaggerFilename: "/test/data/invalid.json"});
		call(handler, {method: "GET", url: "/mcp/tools", headers: {}}, (status, headers, body) => {
			assert.deepEqual(body.data.tools, []);
			done();
		});
	});

	describe("through the middleware", () => {
		let mw = soajs({serviceName: "express", swaggerFilename: "/test/data/swagger.yml"});

		it("Success - answered with a query string and no gateway header", (done) => {
			call(mw, {method: "GET", url: "/mcp/tools?x=1", headers: {}}, (status, headers, body) => {
				assert.equal(status, 200);
				assert.equal(body.data.name, "express");
				done();
			});
		});

		it("Success - express req.path is used when present", (done) => {
			call(mw, {method: "GET", path: "/mcp/tools", url: "/mcp/tools", headers: {}}, (status) => {
				assert.equal(status, 200);
				done();
			});
		});

		it("Success - a request through the gateway goes to the app", (done) => {
			call(mw, {method: "GET", url: "/mcp/tools", headers: {soajsinjectobj: "{}"}}, (status) => {
				assert.equal(status, null);
				done();
			});
		});

		it("Success - other methods and paths go to the app", (done) => {
			call(mw, {method: "POST", url: "/mcp/tools", headers: {}}, (status) => {
				assert.equal(status, null);
				call(mw, {method: "GET", url: "/mcp/tools/x", headers: {}}, (status) => {
					assert.equal(status, null);
					done();
				});
			});
		});
	});
});
