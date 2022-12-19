import { Server, Socket } from 'socket.io';
import Room from '../models/room';
import * as db from '../services/database.service';

const io = new Server({ /* options */ });
const fs = require('fs');

// =========== rooms array variable =========================
// This variable is used to store online rooms
const rooms: Array<Room> = [];
const sockets: Array<Socket> = [];

function findSocket(username: string): Socket | null {
  let socket = null;
  sockets.forEach((element) => {
    if (element.data.username === username) socket = element;
  });
  return socket;
}

function roomExists(room: string): boolean {
  let ret = false;
  rooms.forEach((element) => {
    if (element.name.match(room)) ret = true;
  });
  return ret;
}

function findRoom(room: string): Room | null {
  let roomFound = null;
  rooms.forEach((element) => {
    if (element.name.match(room)) roomFound = element;
  });
  return roomFound;
}

db.connectToDatabase().then(() => {
  // ============ MIDDLEWARE ============
  // verify if the user has logged in
  io.use((socket, next) => {
    console.log('New connection entering');
    const { username } = socket.handshake.auth;
    if (!username) {
      return next(new Error('Invalid username'));
    }
    const tmp = findSocket(username);
    if (tmp !== null) {
      return next(new Error('User already connected'));
    }
    socket.data.username = username;
    return next();
  });

  // Create a default room
  rooms.push(new Room('home'));

  // When a user connect
  io.on('connection', (socket) => {
    console.log('New user has connected : ', socket.data.username);
    // This variable is used to store current room of the user
    socket.data.id = socket.id;
    socket.data.room = rooms[0].name;
    socket.join(rooms[0].name);
    sockets.push(socket);
    rooms[0].nbUser += 1;

    // ======================= Room ============================
    // this event is use to join/create a room for the current user
    socket.on('join', (data) => {
      // add the room to rooms list if it doesn't exist
      if (!roomExists(data.room)) {
        rooms.push(new Room(data.room, data.password));
      }
      const toJoin = findRoom(data.room);
      const toLeave = findRoom(socket.data.room);
      if (toJoin !== null && toLeave !== null) {
        if (toJoin.checkPassword(data.password)) {
          socket.leave(socket.data.room);
          toLeave.nbUser -= 1;
          if (toLeave.name !== 'home' && toLeave.nbUser === 0) rooms.splice(rooms.indexOf(toLeave), 1);
          socket.join(toJoin.name);
          toJoin.nbUser += 1;
          console.log('Left : ', toLeave.nbUser);
          console.log('Joined : ', toJoin.nbUser);
          // set current user's room
          socket.data.room = data.room;
          console.log('Users room :', socket.data.room);
          socket.to(socket.data.room).emit('joinedroom', socket.data.username);
        } else {
          socket.emit('message', 'Wrong password');
        }
      }
    });
    // ======================= end Room ============================

    // ======================= username ============================
    // this event save the current users name and sends the room list
    socket.on('name', (data) => {
      socket.emit('roomList', rooms);
      socket.data.username = data;
      console.log('User ', `\x1b[41m ${socket.data.username} \x1b[0m`, '\x1b[33m has connected \x1b[0m');
    });

    // ======================= Register ============================
    socket.on('register', (data) => {
      console.log('register');
      db.createUser(data.username, data.password).then((response) => {
        if (response) {
          console.log('User added');
          socket.data.username = data.username;
        }
      });
    });

    // ======================= Login ============================
    // this event is used to log, not implemented yet
    socket.on('login', (data) => {
      console.log('login');
      db.checkUser(data.username, data.password).then((response) => {
        if (response) {
          console.log('User logged');
          socket.data.username = data.username;
        }
      });
    });

    // ======================= Direct Messages ============================
    // this event sends a message to a specific user, not implemented yet
    socket.on('dm', (dataCollection) => {
      const to = findSocket(dataCollection.username);
      if (to !== null) {
        socket.to(to.id).emit('message', `From : ${socket.data.username} : ${dataCollection.message}`);
        db.insertDM(dataCollection.message, socket.data.username, 'private', to.data.username).then(() => {
          console.log('message added to db');
        });
      }
    });

    // ======================= disconnection ============================
    socket.on('disconnect', () => {
      console.log(`${socket.data.username} has disconnected`);
      const toLeave = findRoom(socket.data.room);
      if (toLeave) {
        toLeave.nbUser -= 1;
        if (toLeave.name !== 'home' && toLeave.nbUser === 0) {
          rooms.splice(rooms.indexOf(toLeave), 1);
        }
      }
    });

    // RoomList
    socket.on('roomList', () => {
      socket.emit('roomList', rooms);
    });

    // ======================= message ============================
    // this event send a message to the user's room
    socket.on('send', (data) => {
      // client messages
      socket.to(socket.data.room).emit('message', (`${socket.data.username} : ${data}`));
      db.insertMessage(data, socket.data.username, 'chat', socket.data.room).then(() => {
        console.log(`${socket.data.username} a envoyer : ${data}`);
      });
    });
    //= ================= export ============================
    socket.on('export', (dataCollection) => {
      if (dataCollection.username === socket.data.username) {
        let content = '';
        fs.writeFile(`./export${dataCollection.username}.txt`, content, (error: any) => {
          if (error) throw error;
        });
        db.exportMsg(dataCollection.username).then((msg) => {
          if (msg) {
            msg.forEach((element) => {
              content = element.content;
              fs.appendFile(`./export${dataCollection.username}.txt`, `${content}\n`, (error: any) => {
                if (error) throw error;
              });
            });
          }
        });
      }
    });

    // export with date time
    socket.on('exportTime', (data) => {
      if (data.username === socket.data.username) {
        let content = '';
        fs.writeFile(`./export${data.username}.txt`, content, (error: any) => {
          if (error) throw error;
        });
        db.exportMsgDate(data.username, data.startDate, data.endDate).then((msg) => {
          if (msg) {
            msg.forEach((element) => {
              content = element.content;
              fs.appendFile(`./export${data.username}.txt`, `${content}\n`, (error: any) => {
                if (error) throw error;
              });
            });
          }
        });
      }
    });
  });

  io.listen(3000);
  console.log('Listening on port 3000');
});
