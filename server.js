const express = require('express')
const path = require("path")
const http = require("http")
const socketio = require('socket.io')
const formatMessage = require("./utils/messages")
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require("./utils/users")

const PORT = 3000 || process.env.PORT // akan melihat apakah env variabel yang bernama port dan jika tidak akan menggunakan port 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)

// set static folder : join the current directory and public folder
app.use(express.static(path.join(__dirname, 'public')))

const botName = 'chatBot'

// run when client connects. Listen to some event called connection
io.on('connection', socket => {
    socket.on("joinRoom", ({username, room}) => {
        const user = userJoin(socket.id,username, room)

        socket.join(user.room)

         // welcome current user
        socket.emit('message', formatMessage(botName, 'Wecome Aboard!'));

        // broadcast when a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, `${user.username} has join the chat!`))

        // send users and room info
        io.to(user.room).emit("roomUsers", {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })
    
    // listen for chatMessage from client side
    socket.on("chatMessage" , (msg) => {
        const user = getCurrentUser(socket.id)

        // emit the message back to all user
        io.to(user.room).emit("message", formatMessage(user.username, msg))
    })

    // runs when client disconnects
    socket.on('disconnect', () => {
        const user = userLeave(socket.id)[0];

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`))

            // send users and room info
            io.to(user.room).emit("roomUsers", {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }

    })
})

server.listen(PORT, () => console.log(`server running: ${PORT}`))








/* 
    NOTES: 
    + express.static() :
        - Express has a built-in middleware for serving static files from a directory. For example, suppose you have a public directory that contains files like images, CSS, and HTML.
        - we can use the express.static() middleware to make it possible to access files from this folder via HTTP

    + kenapa kita harus import http module sedangkan express sudah secara default menggunakannya saat initialize server?
        - karena harus di akses directly saat kita ingin menggunakan socket

    + socket.emit()
        - EMIT to the single users that connecting
        - The Socket.IO API is inspired from the Node.js EventEmitter, which means you can emit events on one side and register listeners on the other:
        - memancarkan EVENTS dari satu side/sisi dan menyediakan LISTENERS di side/sisi lain (FE dan BE)

    + socket.broadcast.emit()
        - will EMIT to everybody except the users that connecting

    + io.emit()
        - will emit to all users in general
*/