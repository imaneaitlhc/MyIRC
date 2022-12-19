import * as mongoDB from 'mongodb';
import * as dotenv from 'dotenv';
import Message from '../models/message';
import User from '../models/user';

const bcrypt = require('bcrypt');

// Array of collections to match database
const collections: {
  messages?: mongoDB.Collection,
  users?: mongoDB.Collection } = {};

let client: mongoDB.MongoClient;

// =============== DATABASE CONNECTION ===============
export async function connectToDatabase() {
  dotenv.config();
  if (process.env.DB_CONN_STRING
      && process.env.MESSAGE_COLLECTION_NAME
      && process.env.USER_COLLECTION_NAME
      && process.env.ROOM_COLLECTION_NAME) {
    client = new mongoDB.MongoClient(process.env.DB_CONN_STRING);
    // Connect to database server
    await client.connect();
    // Connect to database
    const db: mongoDB.Db = client.db(process.env.DB_NAME);
    // Get collections from database
    const msgCollection: mongoDB.Collection = db.collection(process.env.MESSAGE_COLLECTION_NAME);
    const usersCollection: mongoDB.Collection = db.collection(process.env.USER_COLLECTION_NAME);
    // const roomsCollection: mongoDB.Collection = db.collection(process.env.ROOM_COLLECTION_NAME);
    // Store collections into the array
    collections.messages = msgCollection;
    collections.users = usersCollection;
    // collections.rooms = roomsCollection;
  }
}
// =============== END DATABASE CONNECTION ===============

// =============== INSERT MESSAGE INTO DB ===============
export async function insertMessage(msg: string, user: string, type: string, room: string) {
  if (collections.messages) {
    try {
      const newMessage = new Message(user, msg, type, undefined, room);
      await collections.messages.insertOne(newMessage);
    } catch (error) {
      console.error(error);
    }
  }
}

export async function insertDM(msg: string, user: string, type: string, receiver: string) {
  if (collections.messages) {
    try {
      const newMessage = new Message(user, msg, type, receiver);
      await collections.messages.insertOne(newMessage);
    } catch (error) {
      console.error(error);
    }
  }
}

// =============== GET USER FROM DB ===============
export async function getUser(username: string) {
  const query = { name: username };
  if (collections.users) {
    return collections.users.findOne(query);
  }
  return null;
}

// fetch messages
export async function exportMsg(username: string) {
  const user = await getUser(username);
  if (user) {
    if (collections.messages) {
      const msg = await collections.messages.find({ userName: username });
      return msg;
    }
  }
  return null;
}

export async function exportMsgDate(username: string, startDate: number, endDate: number) {
  const user = await getUser(username);
  if (user) {
    if (collections.messages) {
      const query = {
        $and: [
          {
            userName: username,
          }, {
            datetime: {
              $gte: startDate,
            },
          }, {
            datetime: {
              $lte: endDate,
            },
          },
        ],
      };
      const res = await collections.messages.find(query);
      return res;
    }
  }
  return null;
}

export async function checkUser(username: string, password: string) {
  const user = await getUser(username);
  if (user) {
    // verify password
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return true;
    }
    console.log('Wrong password');
  } else {
    console.log('No user were found');
  }
  return false;
}

// =============== HASH PASSWORD ===============
async function hashPassword(password: string, saltRounds = 10) {
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(saltRounds);

    // Hash password
    const hash = await bcrypt.hash(password, salt);
    if (hash) return hash;
    return null;
  } catch (error) {
    console.log(error);
  }
  // throw error if hash failed
  throw new Error("Couldn't hash password");
}

// =============== ADD USER TO DB ===============
export async function createUser(username: string, password: string) {
  // if the user doesn't exist in db
  if (await getUser(username) === null) {
    if (collections.users) {
      try {
        const hash = await hashPassword(password);
        if (hash !== null) {
          const newUser = new User(username, hash, false);
          await collections.users.insertOne(newUser);
          return true;
        }
      } catch (error) {
        console.error(error);
      }
    }
  } else {
    console.log('User already exists');
  }
  return false;
}

export async function disconnect() {
  await client.close();
}
