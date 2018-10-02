const express = require('express')
const app = express()
const host = 'localhost';
const port = 3000

app.get('/', function (req, res){
	res.send('Oh, hi!')
})

app.listen(port, host, () => console.log('Listening on '+host+':'+port+'!'))