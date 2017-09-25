'use strict';
var registry_struct = {};
var autoReloadTimeout = {};

/**
 *
 * @param configuration
 * @returns {Function}
 */
module.exports = function (configuration) {
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

    function execRegistry(param, cb) {
        var err = null;
        //TODO: this should not be equal to registry. this should be reg Functions with all the methods. like new reg(env)
        var reg = null;
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
                if (!err) {
                    if (body.result) {
                        reg = body.data;
                        registry_struct[reg.environment] = reg;
                        if (reg && reg.serviceConfig.awareness.autoRelaodRegistry) {
                            var autoReload = function () {
                                execRegistry(param, function (err, reg) {
                                    if (reg.serviceConfig.awareness.autoRelaodRegistry) {
                                        if (!autoReloadTimeout[reg.environment])
                                            autoReloadTimeout[reg.environment] = {};
                                        if (autoReloadTimeout[reg.environment].timeout)
                                            clearTimeout(autoReloadTimeout[reg.environment].timeout);
                                        autoReloadTimeout[reg.environment].setBy = param.setBy;
                                        autoReloadTimeout[reg.environment].timeout = setTimeout(autoReload, reg.serviceConfig.awareness.autoRelaodRegistry);
                                    }
                                });
                            };
                            if (!autoReloadTimeout[reg.environment])
                                autoReloadTimeout[reg.environment] = {};
                            if (autoReloadTimeout[reg.environment].timeout)
                                clearTimeout(autoReloadTimeout[reg.environment].timeout);
                            autoReloadTimeout[reg.environment].setBy = param.setBy;
                            autoReloadTimeout[reg.environment].timeout = setTimeout(autoReload, reg.serviceConfig.awareness.autoRelaodRegistry);
                        }
                    }
                }
                cb(err, reg);
            });
        }
        else
            cb(err, reg);
    }

    return function (req, res, next) {
        if (!req.soajs)
            req.soajs = {"error":[]};
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
            if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
                var param = {
                    "envCode": process.env.SOAJS_ENV.toLowerCase(),
                    "serviceName": req.soajs.serviceName

                };
                execRegistry(param, function (err, reg) {
                    req.soajs.reg = reg;
                    if (err)
                        req.soajs.error.push (err);
                    next();

                });
            }
        }
        else {
            if (process.env.SOAJS_REGISTRY_API && process.env.SOAJS_ENV) {
                var param = {
                    "envCode": process.env.SOAJS_ENV.toLowerCase(),
                    "serviceName": req.soajs.serviceName

                };
                execRegistry(param, function (err, reg) {
                    req.soajs.reg = reg;
                    if (err)
                        req.soajs.error.push (err);
                    next();

                });
            }
        }
    };
};