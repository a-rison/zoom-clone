const express = require('express')
const app = express()
const serverless = require('serverless-http')
const server = require('http').Server(app)
const io = require('socket.io')(server, {
    forceNew: true,
    transports: ["polling"],
})
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
const { v4: uuidV4 } = require('uuid')
app.use("/.netlify/functions.server",express.Router )
app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room })
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.to(roomId).emit('user-connected', userId)
        socket.on('message', message => {
            io.to(roomId).emit('createMessage',message) 
        })
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })
        socket.on('toggle-video', data => {
            socket.broadcast.emit('toggle-video', data);
        })
        socket.on('toggle-audio', data => {
            socket.broadcast.emit('toggle-audio', data);
        });
    })
})

server.listen(3000)

module.exports.handler = serverless(app)