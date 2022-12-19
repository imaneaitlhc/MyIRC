import { io } from 'socket.io-client';
import parser from './params';
import getParam from './connectionParams';
import Room from "../models/room";

const rlSync = require('readline-sync');

// ========= Socket creation ==============
const socket = io('http://localhost:3000', { autoConnect: false });

function chat() {
  console.clear();
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  // ========= room Join ==============
  // displays a message when a user joins the room
  socket.on('joinedroom', (username) => {
    console.log('\x1b[33m', username, 'have join the room \x1b[0m');
  });
  // ========= End room Join ==============

  // ========= room Array List ==============
  socket.on('roomList', (rooms) => {
    console.log('\x1b[33m Available rooms : \x1b[0m');
    rooms.forEach((element: Room) => {
      console.log('Room name : ', element.name, " | connected users : ", element.nbUser);
    });
  });
  // ========= End room Array List ==============

  // ========= Message ==============
  // displays a message when send
  socket.on('message', (arg1) => {
    console.log(arg1);
  });

  // ========= User input ==============
  // parse user's messages and send event based on the parameters, if there is no parameters just send the message
  socket.emit('roomList');
  rl.on('line', (line: string) => {
    const dataCollection = parser(line);
    if (dataCollection !== null) {
      console.log(dataCollection.event);
      socket.emit(dataCollection.event, dataCollection);
    } else {
      socket.emit('send', line);
    }
  });
}

async function userConnection() {
  socket.auth = { username: null };
  console.clear();
  console.log('\x1b[47m \x1b[35m============================    Welcome to VRCHAT!    ============================== \x1b[0m\x1b[0m\n');
  console.log("\x1b[34m                                  .#@@@@@@@@*                                  \n" +
      "                              &@@@@@@@@&#%@@@@@@@@@/                            \n" +
      "                           @@@@@                 (@@@@%                         \n" +
      "                         @@@@                       .@@@@                       \n" +
      "                       @@@@                            @@@/                     \n" +
      "                      @@@,     *@@@@@                   @@@%                    \n" +
      "                     @@@/      @@@@@@@                   @@@                    \n" +
      "                     @@@       ,@@@@                     *@@@                   \n" +
      "                     @@@         @@@@,                   .@@@                   \n" +
      "                     @@@           @@@@@     @@@.        &@@%                   \n" +
      "                     *@@@            /@@@@@@@@@@@@@      @@@                    \n" +
      "                      (@@@                @@@@@@@(     *@@@                     \n" +
      "                       /@@@                           @@@@                      \n" +
      "                      ,@@@                         &@@@@                        \n" +
      "                      @@@ %@@@@@@@&           .@@@@@@                           \n" +
      "                     @@@@@@@%   /@@@@@@@@@@@@@@@&                               \n" +
      "                    %.                           \x1b[0m");                        
  console.log('\x1b[32mTry --help if you don\'t know any commands\x1b[0m');
  do {
    const input = rlSync.question('Enter a command :\n');
    const username = await getParam(input);
    if (username) {
      socket.auth = { username };
      socket.connect();
      rlSync.question('\x1b[36mPress \'Enter\' to continue\x1b[0m');
      chat();
    }
  } while (!socket.auth.username);
}

userConnection().then();
