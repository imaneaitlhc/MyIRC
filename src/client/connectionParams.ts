import * as db from '../services/database.service';

async function login(params: Array<string>) {
  if (params.length === 5) {
    if (params[1] === '-u' && params[3] === '-p') {
      await db.connectToDatabase();
      const res = await db.checkUser(params[2], params[4]);
      if (res) {
        console.log('\x1b[33mLogged in\x1b[0m');
        await db.disconnect();
        return params[2];
      }
    }
  }
  return null;
}

async function register(params: Array<string>) {
  if (params.length === 5) {
    if (params[1] === '-u' && params[3] === '-p') {
      await db.connectToDatabase();
      const res = await db.createUser(params[2], params[4]);
      if (res) {
        console.log('\x1b[33mRegistered and logged in\x1b[0m');
        await db.disconnect();
        return params[2];
      }
    }
  }
  return null;
}

function help() {
  console.log('\x1b[33mAvailable commands \x1b[0:');
  console.log('--login -u <username> -p <password>');
  console.log('--register -u <username> -p <password>');
}

export default async function getParam(line: string) {
  line = line.replace(/  +/g, ' ');
  const arrLine = line.split(' ');
  switch (arrLine[0]) {
    case '--login':
      return login(arrLine);
    case '--register':
      return register(arrLine);
    case '--help':
      help();
      break;
    default:
      console.log('\x1b[31mWrong command. Use --help to have info\x1b[0m');
      break;
  }
  return null;
}
