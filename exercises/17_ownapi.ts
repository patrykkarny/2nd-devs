import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('ownapi');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const answer = await sendTask(
  token,
  'https://twond-devs.onrender.com/api/chat',
);
console.log('--- answer ---: ', answer);
