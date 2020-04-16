'use strict';
/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const express = require('express');
const helper = require("../helper.js");
const soajsMW = helper.requireModule("index.js");
const soajsConf = require('./soa.json');

let app = express();

function startServer(callback) {
	app.use(soajsMW(soajsConf));
	
	app.get('/heartbeat', (req, res) => {
		res.send({"status": 1});
	});
	
	app.get('/hello', (req, res) => {
		res.send(req.soajs);
	});
	
	app.get('/mix/test', (req, res) => {
		let response = {};
		req.soajs.awareness.getHost((host) => {
			response.controller = host;
			if (req.soajs.reg) { // if SOAJS_REGISTRY_API is set and everything went well, reg will be defined
				response.databases = req.soajs.reg.getDatabases();
			}
			res.send(response);
		});
	});
	
	app.get('/connect/tests', (req, res) => {
		let response = {};
		req.soajs.awareness.connect("urac", "2", (data) => {
			response.test1 = data;
			req.soajs.awareness.connect("urac", (data) => {
				response.test2 = data;
				req.soajs.awareness.connect((data) => {
					response.test3 = data;
					req.soajs.awareness.connect("urac", "3", (data) => {
						response.test4 = data;
						res.send(response);
					});
				});
			})
		});
	});
	
	app.httpServer = app.listen(soajsConf.servicePort, () => {
		callback();
	});
}

function killServer(callback) {
	app.httpServer.close(() => {
		callback();
	});
}

module.exports = {
	startServer: startServer,
	killServer: killServer
};