'use strict';
/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

let request = require("request");

let registry_struct = {};
let autoReloadTimeout = {};


module.exports = (configuration, callback) => {
	
	let regObj = {
		env: null,
		serviceName: null,
		
		/**
		 * returns database object if dbName provided, if not, return all core and tenant meta databases
		 *
		 * @param dbName
		 * @returns {*}
		 */
		getDatabases: (dbName) => {
			if (regObj.env && registry_struct[regObj.env]) {
				// if no db name specified: merge coreDB & tenantMetaDB and return the output
				if (!dbName) {
					if (!registry_struct[regObj.env].tenantMetaDB && !registry_struct[regObj.env].coreDB) {
						return null;
					} else { // if one of them is undefined, no problem
						let obj = {};
						obj = Object.assign(obj, registry_struct[regObj.env].coreDB);
						obj = Object.assign(obj, registry_struct[regObj.env].tenantMetaDB);
						return obj;
					}
				} else {
					// check in coreDB and in tenantMetaDB
					if (registry_struct[regObj.env].coreDB && registry_struct[regObj.env].coreDB[dbName]) {
						return registry_struct[regObj.env].coreDB[dbName];
					}
					if (registry_struct[regObj.env].tenantMetaDB && registry_struct[regObj.env].tenantMetaDB[dbName]) {
						return registry_struct[regObj.env].tenantMetaDB[dbName];
					}
				}
			}
			return null;
		},
		
		/**
		 * returns service configuration object
		 *
		 * @returns {*}
		 */
		getServiceConfig: () => {
			if (regObj.env && registry_struct[regObj.env]) {
				return registry_struct[regObj.env].serviceConfig;
			}
			return null;
		},
		
		/**
		 * returns deployer object
		 *
		 * @returns {*}
		 */
		getDeployer: () => {
			if (regObj.env && registry_struct[regObj.env]) {
				return registry_struct[regObj.env].deployer;
			}
			return null;
		},
		
		/**
		 * returns custom object
		 *
		 * @returns {*}
		 */
		getCustom: () => {
			if (regObj.env && registry_struct[regObj.env]) {
				return registry_struct[regObj.env].custom;
			}
			return null;
		},
		
		/**
		 * returns resource object if resourceName provided, if not returns all resources
		 *
		 * @returns {*}
		 */
		getResources: (resourceName) => {
			if (regObj.env && registry_struct[regObj.env] && registry_struct[regObj.env].resources) {
				if (resourceName) {
					return registry_struct[regObj.env].resources[resourceName];
				} else {
					return registry_struct[regObj.env].resources;
				}
			}
			return null;
		},
		
		/**
		 * returns service object if serviceName provided, if not, returns all services
		 *
		 * @returns {*}
		 */
		getServices: (serviceName) => {
			if (regObj.env && registry_struct[regObj.env] && registry_struct[regObj.env].services) {
				if (serviceName) {
					return registry_struct[regObj.env].services[serviceName];
				} else {
					return registry_struct[regObj.env].services;
				}
			}
			return null;
		},
		
		/**
		 * returns daemon object if daemonName provided, if not, returns all daemons
		 *
		 * @returns {*}
		 */
		getDaemons: (daemonName) => {
			if (regObj.env && registry_struct[regObj.env] && registry_struct[regObj.env].daemons) {
				if (daemonName) {
					return registry_struct[regObj.env].daemons[daemonName];
				} else {
					return registry_struct[regObj.env].daemons;
				}
			}
			return null;
		},
		
		reload: (cb) => {
			if (regObj.env && regObj.serviceName) {
				execRegistry({
					"envCode": regObj.env,
					"serviceName": regObj.serviceName
					
				}, (err) => {
					if (err) {
						cb(err, false);
					} else {
						cb(err, true);
					}
				});
			} else {
				let err = new Error('Cannot reload registry. Env and serviceName are not set');
				cb(err, false);
			}
		}
	};
	
	function mapInjectedObject(req) {
		let input = req.headers.soajsinjectobj;
		if (typeof input === 'string') {
			input = JSON.parse(input);
		}
		if (!input) {
			return null;
		}
		let output = {};
		if (input.tenant) {
			output.tenant = {
				id: input.tenant.id,
				code: input.tenant.code,
				type: input.tenant.type
			};
			if (input.tenant.name) {
				output.tenant.name = input.tenant.name;
			}
			if (input.tenant.main) {
				output.tenant.main = input.tenant.main;
			}
			if (input.tenant.profile) {
				output.tenant.profile = input.tenant.profile;
			}
		}
		if (input.key) {
			output.key = {
				config: input.key.config,
				iKey: input.key.iKey,
				eKey: input.key.eKey
			};
		}
		if (input.application) {
			output.application = {
				product: input.application.product,
				package: input.application.package,
				appId: input.application.appId,
				acl: input.application.acl || null,
				acl_all_env: input.application.acl_all_env || null
			};
		}
		if (input.package) {
			output.package = {
				acl: input.package.acl || null,
				acl_all_env: input.package.acl_all_env || null
			};
		}
		if (input.device) {
			output.device = input.device || '';
		}
		if (input.geo) {
			output.geo = input.geo || {};
		}
		if (input.urac) {
			output.urac = input.urac || null;
		}
		if (input.awareness) {
			output.awareness = {
				host: input.awareness.host || "",
				port: input.awareness.port || ""
			};
			output.awareness.getHost = function () { // fat arrows don't have arguments
				let host = null;
				if (!input.awareness.host) {
					return host;
				}
				
				let serviceName = null, version = null, cb = arguments[arguments.length - 1];
				
				switch (arguments.length) {
					//controller, cb
					case 2:
						serviceName = arguments[0];
						break;
					
					//controller, 1, cb
					case 3:
						serviceName = arguments[0];
						version = arguments[1];
						break;
				}
				
				host = input.awareness.host;
				let gatewayServiceName = "controller";
				let reg_services = regObj.getServices();
				if (reg_services && reg_services.controller && reg_services.controller.name) {
					gatewayServiceName = reg_services.controller.name;
				}
				if (serviceName && serviceName.toLowerCase() !== gatewayServiceName) {
					host += ":" + input.awareness.port + "/";
					host += serviceName;
					if (version && !isNaN(parseInt(version))) {
						host += "/v" + version;
					}
				} else {
					host += ":" + input.awareness.port;
				}
				return cb(host);
			};
			output.awareness.connect = function () {
				let response = null;
				if (!input.awareness.host) {
					return response;
				}
				let serviceName = null, version = null, cb = arguments[arguments.length - 1];
				switch (arguments.length) {
					//controller, cb
					case 2:
						serviceName = arguments[0];
						break;
					
					//controller, 1, cb
					case 3:
						serviceName = arguments[0];
						version = arguments[1];
						break;
				}
				response = {};
				if (process.env.SOAJS_DEPLOY_HA && serviceName && configuration.interConnect && input.awareness.interConnect && Array.isArray(input.awareness.interConnect) && input.awareness.interConnect.length > 0) {
					for (let i = 0; i < input.awareness.interConnect.length; i++) {
						let serviceObj = input.awareness.interConnect[i];
						if (serviceObj.name === serviceName) {
							if (!version && serviceObj.version === serviceObj.latest) {
								response.host = serviceObj.host + ":" + serviceObj.port;
								break;
							} else {
								if (version === serviceObj.version) {
									response.host = serviceObj.host + ":" + serviceObj.port;
									break;
								}
							}
						}
					}
					if (response.host) {
						response.headers = {};
						response.headers.soajsinjectobj = req.headers.soajsinjectobj;
						return cb(response);
					}
				}
				if (!response.host) {
					output.awareness.getHost(serviceName, version, (host) => {
						response.host = host;
						if ((output.key && output.key.eKey) || (req.query && req.query.access_token)) {
							response.headers = {};
							if (output.key && output.key.eKey) {
								response.headers.key = output.key.eKey;
							}
							if (req.query && req.query.access_token) {
								response.headers.access_token = req.query.access_token;
							} else if (req.headers && req.headers.access_token) {
								response.headers.access_token = req.headers.access_token;
							} else if (req.headers && req.headers.Authorization) {
								response.headers.Authorization = req.headers.Authorization;
							}
						}
						return cb(response);
					});
				}
			};
		}
		
		return output;
	}
	
	function execRegistry(param, cb) {
		let err = null;
		if (!process.env.SOAJS_REGISTRY_API || process.env.SOAJS_REGISTRY_API.indexOf(":") === -1) {
			err = new Error('Invalid format for SOAJS_REGISTRY_API [hostname:port]: ' + process.env.SOAJS_REGISTRY_API);
		}
		if (!err) {
			let portFromEnv = process.env.SOAJS_REGISTRY_API.substr(process.env.SOAJS_REGISTRY_API.indexOf(":") + 1);
			let port = parseInt(portFromEnv);
			if (isNaN(port)) {
				err = new Error('port must be integer: [' + portFromEnv + ']');
			}
		}
		
		if (!err) {
			let requestOption = {
				"url": "http://" + process.env.SOAJS_REGISTRY_API + "/getRegistry?env=" + param.envCode + "&serviceName=" + param.serviceName,
				"json": true
			};
			request(requestOption, (err, response, body) => {
				regObj.env = param.envCode;
				regObj.serviceName = param.serviceName;
				if (!err) {
					if (body.result && body.data && body.data.environment) {
						registry_struct[body.data.environment] = body.data;
						let serviceConfig = regObj.getServiceConfig();
						if (serviceConfig && serviceConfig.awareness && serviceConfig.awareness.autoRelaodRegistry) {
							let autoReload = () => {
								execRegistry(param, () => {
									//cb(err);
								});
							};
							if (!autoReloadTimeout[regObj.env]) {
								autoReloadTimeout[regObj.env] = {};
							}
							if (autoReloadTimeout[regObj.env].timeout) {
								clearTimeout(autoReloadTimeout[regObj.env].timeout);
							}
							autoReloadTimeout[regObj.env].setBy = param.setBy;
							autoReloadTimeout[regObj.env].timeout = setTimeout(autoReload, serviceConfig.awareness.autoRelaodRegistry);
						}
					}
				}
				return cb(err);
			});
		} else {
			return cb(err);
		}
	}
	
	function middleware() {
		return (req, res, next) => {
			if (!req.soajs) {
				req.soajs = {"error": []};
			}
			let injectObj = mapInjectedObject(req);
			if (injectObj && injectObj.application && injectObj.application.package && injectObj.key && injectObj.tenant) {
				req.soajs.tenant = injectObj.tenant;
				req.soajs.tenant.key = {
					"iKey": injectObj.key.iKey,
					"eKey": injectObj.key.eKey
				};
				req.soajs.tenant.application = injectObj.application;
				if (injectObj.package) {
					req.soajs.tenant.application.package_acl = injectObj.package.acl;
					req.soajs.tenant.application.package_acl_all_env = injectObj.package.acl_all_env;
				}
				req.soajs.urac = injectObj.urac;
				req.soajs.servicesConfig = injectObj.key.config;
				req.soajs.device = injectObj.device;
				req.soajs.geo = injectObj.geo;
				req.soajs.awareness = injectObj.awareness;
				
				if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
					req.soajs.reg = regObj;
				}
				next();
			} else {
				if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
					req.soajs.reg = regObj;
				}
				next();
			}
		};
	}
	
	if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
		let param = {
			"envCode": process.env.SOAJS_ENV.toLowerCase(),
			"serviceName": configuration.serviceName
		};
		let resume = () => {
			execRegistry(param, (err) => {
				if (typeof callback === 'function') {
					if (!err) {
						callback(null, regObj);
					} else {
						callback(err, null);
					}
				}
			});
			return middleware();
		};
		
		if (process.env.SOAJS_DEPLOY_MANUAL && process.env.SOAJS_DEPLOY_MANUAL !== "0") {
			let requestOption = {
				"url": "http://" + process.env.SOAJS_REGISTRY_API + "/register",
				"json": true,
				"method": "post"
			};
			requestOption.body = {
				"name": configuration.serviceName,
				"type": "service",
				"mw": true,
				
				"group": configuration.serviceGroup,
				"port": configuration.servicePort,
				"swagger": configuration.swagger,
				"requestTimeout": configuration.requestTimeout,
				"requestTimeoutRenewal": configuration.requestTimeoutRenewal,
				"version": configuration.serviceVersion,
				"extKeyRequired": configuration.extKeyRequired,
				"urac": configuration.urac,
				"urac_Profile": configuration.urac_Profile,
				"urac_ACL": configuration.urac_ACL,
				"urac_Config": configuration.urac_Config,
				"urac_GroupConfig": configuration.urac_GroupConfig,
				"tenant_Profile": configuration.tenant_Profile,
				"provision_ACL": configuration.provision_ACL,
				"oauth": configuration.oauth,
				"interConnect": configuration.interConnect,
				
				"ip": configuration.ip || "127.0.0.1",
				
				"maintenance": configuration.maintenance
			};
			request(requestOption, () => {
			});
		}
		return resume();
	} else {
		return middleware();
	}
};