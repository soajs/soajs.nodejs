/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */
'use strict';

module.exports = {
	"result": true,
	"ts": 1586985212333,
	"service": {"service": "soajs.controller", "version": "3.1.8", "type": "rest", "route": "/getRegistry"},
	"data": {
		"timeLoaded": 1586985212284,
		"name": "dev",
		"environment": "dev",
		"coreDB": {
			"provision": {
				"name": "core_provision",
				"prefix": "",
				"servers": [{"host": "127.0.0.1", "port": 32017}],
				"credentials": null,
				"streaming": {},
				"extraParam": {},
				"URLParam": {"useUnifiedTopology": true},
				"registryLocation": {"l1": "coreDB", "l2": "provision", "env": "dashboard", "timeLoaded": 1586985212284}
			},
			"session": {
				"prefix": "",
				"registryLocation": {"l1": "coreDB", "l2": "session", "env": "dashboard", "timeLoaded": 1586985212284},
				"servers": null,
				"credentials": null,
				"URLParam": null,
				"extraParam": null
			}
		},
		"tenantMetaDB": {
			"urac": {
				"prefix": "",
				"cluster": "dash_cluster",
				"servers": [{"host": "192.168.1.50", "port": 32017}],
				"credentials": null,
				"URLParam": {"useUnifiedTopology": true},
				"extraParam": {},
				"streaming": {},
				"name": "#TENANT_NAME#_urac",
				"registryLocation": {
					"l1": "metaDB",
					"l2": "#TENANT_NAME#_urac",
					"env": "dashboard",
					"cluster": "dash_cluster",
					"timeLoaded": 1586985212284
				}
			}
		},
		"serviceConfig": {
			"awareness": {
				"cacheTTL": 3600000,
				"healthCheckInterval": 5000,
				"autoRelaodRegistry": 1500,
				"maxLogCount": 5,
				"autoRegisterService": true
			},
			"agent": {"topologyDir": "/opt/soajs/"},
			"logger": {"src": false, "level": "debug", "formatter": {"levelInString": false, "outputMode": "short"}},
			"ports": {"controller": 4000, "maintenanceInc": 1000, "randomInc": 100},
			"cookie": {"secret": "this is a secret sentence"},
			"session": {
				"name": "soajsID",
				"secret": "this is antoine hage app server",
				"cookie": {"path": "/", "httpOnly": true, "secure": false, "maxAge": null},
				"resave": false,
				"saveUninitialized": false,
				"rolling": false,
				"unset": "keep"
			},
			"key": {"algorithm": "aes256", "password": "soajs key lal massa"}
		},
		"deployer": {
			"type": "manual",
			"selected": "manual",
			"manual": {"nodes": "127.0.0.1"},
			"container": {
				"docker": {
					"local": {"nodes": "", "socketPath": "/var/run/docker.sock"},
					"remote": {"apiPort": "", "nodes": "", "apiProtocol": "", "auth": {"token": ""}}
				},
				"kubernetes": {
					"local": {"nodes": "", "apiPort": "", "namespace": "", "auth": {"token": ""}},
					"remote": {"nodes": "", "apiPort": "", "namespace": "", "auth": {"token": ""}}
				}
			}
		},
		"custom": {},
		"resources": {
			"cluster": {
				"dash_cluster": {
					"_id": "5e46e5698e9d9aa766e04514",
					"name": "dash_cluster",
					"type": "cluster",
					"category": "mongo",
					"plugged": true,
					"shared": false,
					"config": {
						"servers": [{"host": "192.168.1.50", "port": 32017}],
						"credentials": null,
						"URLParam": {"useUnifiedTopology": true},
						"extraParam": {},
						"streaming": {}
					},
					"created": "DASHBOARD",
					"author": "owner",
					"locked": true
				}
			}
		},
		"services": {
			"controller": {
				"name": "controller",
				"group": "SOAJS Core Service",
				"version": "1",
				"maxPoolSize": 100,
				"authorization": true,
				"port": 4000,
				"requestTimeout": 30,
				"requestTimeoutRenewal": 0,
				"hosts": {"1": ["127.0.0.1"], "latest": "1"}
			},
			"urac": {
				"group": "SOAJS Core Services",
				"port": 4001
			},
			"oauth": {
				"group": "SOAJS Core Services",
				"port": 4002
			}
		},
		"daemons": {
			"onedaemon": {
				"name": "antoine",
				"group": "SOAJS Core Service",
				"version": "1"
			}
		},
		"awareness": {"host": "127.0.0.1", "port": 4000}
	}
};