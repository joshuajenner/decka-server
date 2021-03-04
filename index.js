const server = require('express')();
const http = require('http').Server(server);

const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;



server.get('/', (req, res) => {
    res.send('Decka Server');
})


server.post('/login', async (req, res) => {
    res.send({ message: "Username not found.", success: false })
    res.end()
})



http.listen(port, hostname, () => {
    console.log(`Server is listening`)
})