/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

'use strict';
const express = require('express');
const sApp = express();
const mApp = express();

const ready_reg = require("./ready_registry.js");

function startServer(serverConfig, callback) {
	if (!serverConfig) {
		serverConfig = {};
	}
	if (!serverConfig.name) {
		serverConfig.name = "controller";
	}
	if (!serverConfig.s) {
		serverConfig.s = {};
		serverConfig.s.port = 4000;
	}
	if (!serverConfig.m) {
		serverConfig.m = {};
		serverConfig.m.port = 5000;
	}
	
	let mReply = {
		'result': true,
		'ts': Date.now(),
		'service': {
			'service': serverConfig.name,
			'type': 'rest',
			'route': "/heartbeat"
		}
	};
	let sReply = {
		'result': true,
		'data': {
			'firstname': "antoine",
			'lastname': "hage",
			'type': "mock service"
		}
	};
	
	sApp.get('/hello', (req, res) => {
		sReply.data.url = req.url;
		sReply.data.method = req.method;
		res.json(sReply);
	});
	
	
	mApp.get('/heartbeat', (req, res) => {
		mReply.service.route = '/heartbeat';
		res.json(mReply);
	});
	mApp.get('/getRegistry', (req, res) => {
		console.log('**** calling ... /getRegistry');
		res.json(ready_reg);
	});
	mApp.post('/register', (req, res) => {
		mReply.service.route = '/register';
		console.log('**** calling ... /register');
		res.json(mReply);
	});
	
	
	let sAppServer = sApp.listen(serverConfig.s.port, () => console.log(`${serverConfig.name} service mock listening on port ${serverConfig.s.port}!`));
	let mAppServer = mApp.listen(serverConfig.m.port, () => console.log(`${serverConfig.name} service mock listening on port ${serverConfig.m.port}!`));
	
	return callback(
		{
			"sAppServer": sAppServer,
			"mAppServer": mAppServer,
			"name": serverConfig.name
		}
	);
}

function killServer(config, callback) {
	console.log("killing server ....");
	
	config.mAppServer.close(() => {
		console.log("...sAppServer: " + config.name);
		config.sAppServer.close(() => {
			console.log("...mAppServer: " + config.name);
			callback();
		});
	});
}

module.exports = {
	startServer: startServer,
	killServer: killServer
};