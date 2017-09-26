'use strict';

var request = require("request");

var registry_struct = {};
var autoReloadTimeout = {};

/**
 *
 * @param configuration
 * @returns {Function}
 */
module.exports = function (configuration) {

    var regObj = {
        env: null,
        serviceName: null,

        getServiceConfig : function(){
            if (regObj.env && registry_struct[regObj.env]) {
                return registry_struct[regObj.env].serviceConfig;
            }
            return null;
        },

        getServices: function () {
            if (regObj.env && registry_struct[regObj.env]) {
                return registry_struct[regObj.env].services;
            }
            return null;
        },

        reload: function (cb) {
            if (regObj.env && regObj.serviceName) {
                execRegistry({
                    "envCode": regObj.env,
                    "serviceName": regObj.serviceName

                }, function (err) {
                    if (err)
                        cb(err, false);
                    else
                        cb(err, true);
                });
            }
            else {
                var err = new Error('Cannot reload registry. Env and serviceName are not set');
                cb(err, false);
            }
        }
    };

    /**
     *
     * @param req
     * @returns {*}
     */
    function mapInjectedObject(req) {
        var input = req.headers['soajsinjectobj'];
        if (typeof input === 'string')
            input = JSON.parse(input);
        if (!input)
            return null;
        var output = {};
        if (input.tenant) {
            output.tenant = {
                id: input.tenant.id,
                code: input.tenant.code
            };
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
        if (input.device)
            output.device = input.device || '';
        if (input.geo)
            output.geo = input.geo || {};
        if (input.urac)
            output.urac = input.urac || null;

        if (input.awareness) {
            output.awareness = {
                host: input.awareness.host || "",
                port: input.awareness.port || "",
                getHost: function () {
                    var serviceName, version, env, cb;
                    cb = arguments[arguments.length - 1];

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

                        //controller, 1, dash, cb [dash is ignored]
                        case 4:
                            serviceName = arguments[0];
                            version = arguments[1];
                            break;
                    }

                    var host = input.awareness.host;

                    if (serviceName && serviceName.toLowerCase() !== 'controller') {
                        host += ":" + input.awareness.port + "/";
                        host += serviceName;

                        if (version && !isNaN(parseInt(version))) {
                            host += "v" + version + "/"
                        }
                    }

                    return cb(host);
                }
            };
        }

        return output;
    }

    /**
     *
     * @param param
     * @param cb
     */
    function execRegistry(param, cb) {
        var err = null;
        if (process.env.SOAJS_REGISTRY_API.indexOf(":") === -1)
            err = new Error('Invalid format for SOAJS_REGISTRY_API [hostname:port]: ' + process.env.SOAJS_REGISTRY_API);

        if (!err) {
            var portFromEnv = process.env.SOAJS_REGISTRY_API.substr(process.env.SOAJS_REGISTRY_API.indexOf(":") + 1);
            var port = parseInt(portFromEnv);
            if (isNaN(port))
                err = new Error('port must be integer: [' + portFromEnv + ']');
        }

        if (!err) {
            var requestOption = {
                "url": "http://" + process.env.SOAJS_REGISTRY_API + "/getRegistry?env=" + param.envCode + "&serviceName=" + param.serviceName,
                "json": true
            };
            request(requestOption, function (err, response, body) {

                regObj.env = param.envCode;
                regObj.serviceName = param.serviceName;

                if (!err) {
                    if (body.result && body.data && body.data.environment) {
                        registry_struct[body.data.environment] = body.data;
                        var serviceConfig = regObj.getServiceConfig();
                        if (serviceConfig && serviceConfig.awareness && serviceConfig.awareness.autoRelaodRegistry) {
                            var autoReload = function () {
                                execRegistry(param, function (err) {
                                    if (serviceConfig.awareness.autoRelaodRegistry) {
                                        if (!autoReloadTimeout[regObj.env])
                                            autoReloadTimeout[regObj.env] = {};
                                        if (autoReloadTimeout[regObj.env].timeout)
                                            clearTimeout(autoReloadTimeout[regObj.env].timeout);
                                        autoReloadTimeout[regObj.env].setBy = param.setBy;
                                        autoReloadTimeout[regObj.env].timeout = setTimeout(autoReload, serviceConfig.awareness.autoRelaodRegistry);
                                    }
                                });
                            };
                            if (!autoReloadTimeout[regObj.env])
                                autoReloadTimeout[regObj.env] = {};
                            if (autoReloadTimeout[regObj.env].timeout)
                                clearTimeout(autoReloadTimeout[regObj.env].timeout);
                            autoReloadTimeout[regObj.env].setBy = param.setBy;
                            autoReloadTimeout[regObj.env].timeout = setTimeout(autoReload, serviceConfig.awareness.autoRelaodRegistry);
                        }
                    }
                }

                cb(err);
            });
        }
        else
            cb(err);
    }

    if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
        var param = {
            "envCode": process.env.SOAJS_ENV.toLowerCase(),
            "serviceName": configuration.serviceName

        };
        execRegistry(param, function (err) {
            console.log(regObj.getServices())
        });
    }

    return function (req, res, next) {
        if (!req.soajs)
            req.soajs = {"error": []};
        var injectObj = mapInjectedObject(req);
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
            if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV)
                req.soajs.reg = regObj;
            next();
        }
        else {
            if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV)
                req.soajs.reg = regObj;
            next();
        }
    };
};