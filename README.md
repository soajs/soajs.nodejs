# soajs.nodejs

SOAJS Node.js middleware for integrating RESTful services with the SOAJS platform. This middleware provides seamless access to SOAJS registry, tenant information, authentication, and service discovery.

## Installation

```bash
npm install soajs.nodejs
```

## Quick Start

Require this middleware in your RESTful Node.js service and append it to your app:

```javascript
const express = require('express');
const app = express();
const soajsMW = require('soajs.nodejs');

app.use(soajsMW({
    serviceName: 'myService',
    serviceGroup: 'myGroup',
    servicePort: 4000,
    serviceVersion: 1
}));
```

Access the SOAJS object anywhere in your APIs:

```javascript
app.post('/helloworld', function(req, res){
    const soajs = req.soajs;

    // Access tenant information
    console.log(soajs.tenant);

    // Access registry
    const databases = soajs.reg.getDatabases();

    res.json({ message: 'Hello World' });
});
```

## Configuration

### Basic Configuration

```javascript
const config = {
    serviceName: 'myService',        // Required: Service name
    serviceGroup: 'myGroup',          // Service group
    servicePort: 4000,                // Service port
    serviceVersion: 1,                // Service version
    interConnect: true                // Enable inter-service communication
};

app.use(soajsMW(config));
```

### Environment Variables

The middleware uses the following environment variables:

- `SOAJS_REGISTRY_API`: Registry API endpoint (format: `hostname:port`)
- `SOAJS_ENV`: Environment name (e.g., `dev`, `prod`)
- `SOAJS_DEPLOY_MANUAL`: Set to enable manual deployment mode
- `SOAJS_DEPLOY_HA`: Enable high availability mode for service discovery

## Features

### Registry Access

Access SOAJS registry information through `req.soajs.reg`:

```javascript
// Get all databases
const databases = req.soajs.reg.getDatabases();

// Get specific database
const userDB = req.soajs.reg.getDatabases('users');

// Get service configuration
const serviceConfig = req.soajs.reg.getServiceConfig();

// Get resources
const resources = req.soajs.reg.getResources();
const specificResource = req.soajs.reg.getResources('resourceName');

// Get services
const services = req.soajs.reg.getServices();
const specificService = req.soajs.reg.getServices('serviceName');

// Get daemons
const daemons = req.soajs.reg.getDaemons();
const specificDaemon = req.soajs.reg.getDaemons('daemonName');

// Reload registry
req.soajs.reg.reload((err, success) => {
    if (err) console.error('Failed to reload:', err);
});

// Stop auto-reload timer
req.soajs.reg.stopAutoReload();
```

### Tenant Information

Access tenant data through `req.soajs.tenant`:

```javascript
app.get('/api/data', function(req, res){
    const tenant = req.soajs.tenant;
    console.log(tenant.id);      // Tenant ID
    console.log(tenant.code);    // Tenant code
    console.log(tenant.key);     // Tenant keys (iKey, eKey)
});
```

### Service Discovery

Use awareness for inter-service communication:

```javascript
app.get('/call-service', function(req, res){
    req.soajs.awareness.connect('otherService', (response) => {
        // response.host contains the service URL
        // response.headers contains necessary auth headers

        const axios = require('axios');
        axios.get(response.host + '/endpoint', {
            headers: response.headers
        })
        .then((httpResponse) => {
            res.json(httpResponse.data);
        })
        .catch((err) => {
            res.status(500).json({ error: err.message });
        });
    });
});
```

### Auto-Reload Registry

Configure automatic registry reloading in your service configuration:

```javascript
{
    "awareness": {
        "autoReloadRegistry": 300000  // Reload every 5 minutes (in milliseconds)
    }
}
```

## API Reference

### req.soajs Object

The middleware adds a `soajs` object to the request with the following properties:

- `tenant`: Tenant information (id, code, type, name, main, profile)
- `tenant.key`: Tenant keys (iKey, eKey)
- `tenant.application`: Application information (product, package, appId, acl)
- `urac`: User account information
- `servicesConfig`: Service-specific configuration
- `device`: Device information
- `geo`: Geographic information
- `awareness`: Service awareness and discovery
- `reg`: Registry access object

### Registry Methods

#### getDatabases(dbName)
Returns database configuration. If `dbName` is provided, returns specific database; otherwise returns merged coreDB and tenantMetaDB.

#### getServiceConfig()
Returns the service configuration object.

#### getDeployer()
Returns the deployer configuration.

#### getCustom()
Returns custom configuration.

#### getResources(resourceName)
Returns resource configuration. If `resourceName` is provided, returns specific resource; otherwise returns all resources.

#### getServices(serviceName)
Returns service configuration. If `serviceName` is provided, returns specific service; otherwise returns all services.

#### getDaemons(daemonName)
Returns daemon configuration. If `daemonName` is provided, returns specific daemon; otherwise returns all daemons.

#### reload(callback)
Manually reload the registry. Callback receives `(err, success)`.

#### stopAutoReload()
Stops the automatic registry reload timer.

## Technical Details

### HTTP Client

The middleware uses **axios** (v1.13.1) for all HTTP requests, providing:
- Promise-based API for modern async/await patterns
- Automatic JSON parsing
- 30-second timeout for all requests
- Robust error handling

### Error Handling

The middleware includes comprehensive error handling:

- JSON parsing errors are caught and handled gracefully
- HTTP requests have 30-second timeouts to prevent hanging
- Registry API validation with detailed error messages
- Service registration failures are logged with status codes
- Port validation ensures values are between 1-65535

```javascript
app.use(soajsMW(config, (err, regObj) => {
    if (err) {
        console.error('Failed to initialize middleware:', err);
        process.exit(1);
    }
    console.log('Middleware initialized successfully');
}));
```

## Examples

### Full Express Example
https://github.com/soajs/soajs.nodejs.express

### Full Hapi Example
https://github.com/soajs/soajs.nodejs.hapi

## License

Apache-2.0

## Performance Optimizations

The middleware includes several performance enhancements:

- **InterConnect Service Indexing**: Services are indexed by name for O(1) lookup instead of O(n) iteration
- **Efficient Object Merging**: Single Object.assign operation for database merging
- **Cleanup Mechanisms**: `stopAutoReload()` method prevents memory leaks from auto-reload timers

## Changelog

### v2.0.3
- **Breaking Change**: Replaced deprecated `request` package with `axios`
- Fixed typo: `autoRelaodRegistry` → `autoReloadRegistry`
- Added JSON.parse error handling for malformed headers
- Improved port validation (1-65535 range)
- Added request timeouts (30 seconds) to prevent hanging
- Added `stopAutoReload()` method for proper cleanup
- Optimized interConnect array iteration with indexing
- Enhanced error logging for service registration
- Updated all tests to use axios
- Improved README documentation

## Support

For issues and questions:
- GitHub: https://github.com/soajs/soajs.nodejs
- Documentation: https://soajs.org
