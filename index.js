
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = process.env.PORT || 5000;
const mkImg   = require('./mkImg.js');
var fs = require('fs');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    fs.readFile('./html/index.html', 'utf-8', function(err, data) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
    })
});
app.post('/api/v1/', (req, res) => {
    console.log(req.method, req.url);
    var result = mkImg.func(req.body);
    const jsonData = req.body;
    if("option" in jsonData){
        if("onlyBase64" in jsonData["option"]){
            res.send(result.split(',')[1])
        } else if("onlyData" in jsonData["option"]){
            res.send(result)
        }
    } else {
        res.json({
            "type" : "png",
            "data" : result,
            "base64" : result.split(',')[1]
        })
    }
});
app.post('/api/v1/test/', (req, res) => {
    console.log(req.method, req.url);
    var result = mkImg.func(req.body);
    res.send(`<img src="${result}">`)
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`))