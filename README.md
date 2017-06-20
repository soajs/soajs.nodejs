# soajs.nodejs

Require this Middle Ware in your restful nodejs service, and append it to your app as follows:

```
var express = require('express');
var app = express();
const soajsMW = require('soajs.nodejs');
app.use(soajsMW({}));
```

Consequently, anywhere in your APIs you can get your soajs object, as follows:

```
app.post('/helloworld', function(req, res){
	var soajs = req.soajs;
});
```

Full Examples:
https://github.com/soajs/soajs.nodejs.express
https://github.com/soajs/soajs.nodejs.hapi
