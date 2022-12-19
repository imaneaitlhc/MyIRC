// function to detect whether the user types a parameter
// ================ Functions ================
function help() {
  console.log('List of commands :');
  console.log('Send message to a user :\n--dm <username> <message>');
  console.log('Join a room :\n--join <room name> <password>');
  console.log('List existing rooms :\n--list');
  console.log('Export user messages:\n--export <username> <start date> <end date>');
  console.log('Date format : YYYY-mm-jjThh:mm:ss');
}

function dm(line: Array<string>) {
  let message = '';
  if (line.length >= 3) {
    for (let i = 2; i < line.length; i += 1) {
      message += `${line[i]} `;
    }
    return ({ event: 'dm', username: line[1], message });
  }
  return null;
}

function join(line: Array<string>) {
  if (line.length === 2) {
    return ({ event: 'join', room: line[1], password: null });
  } if (line.length === 3) {
    return ({ event: 'join', room: line[1], password: line[2] });
  }
  return null;
}

function list(line: Array<string>) {
  if (line.length === 1) {
    return ({ event: 'roomList' });
  }
  return null;
}

function leave(line: Array<string>) {
  if (line.length === 1) {
    return ({ event: 'leave' });
  }
  return null;
}

function disconnect(line: Array<string>) {
  if (line.length === 1) {
    return ({ event: 'disconnect' });
  }
  return null;
}

function exportMessages(line: Array<string>) {
  const dateRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})$/;

  if (line.length === 2) return ({ event: 'export', username: line[1] });
  if (line.length === 4) {
    if (line[2].match(dateRegex) && line[3].match(dateRegex)) {
      const date1 = new Date(line[2]);
      const date2 = new Date(line[3]);
      if (date1 < date2) {
        console.log('Date OK');
        return ({
          event: 'exportTime', username: line[1], startDate: date1.getTime(), endDate: date2.getTime(),
        });
      }
    }
  }
  return null;
}

// ================ Parser ================
export default function parser(line: string) {
  // remove multiple spaces
  line = line.replace(/  +/g, ' ');
  const arrLine = line.split(' ');
  // verify if the user enters a command
  if (arrLine[0].startsWith('--')) {
    switch (arrLine[0]) {
      case '--help':
        help();
        break;
      case '--dm':
        return dm(arrLine);
      case '--join':
        return join(arrLine);
      case '--create':
        return join(arrLine);
      case '--list':
        return list(arrLine);
      case '--leave':
        return leave(arrLine);
      case '--disconnect':
        return disconnect(arrLine);
      case '--export':
        return exportMessages(arrLine);
      case '--clear':
        console.clear();
        break;
      default:
        console.log('Command not found, try --help');
        return null;
    }
  }
  return null;
}
