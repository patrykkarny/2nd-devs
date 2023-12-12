import { authorizeTask, getTask, sendTask } from 'exercises/api';

// Path: exercises/01_helloapi.ts

const token = await authorizeTask('helloapi');
console.log('--- token ---: ', token);
const task = await getTask(token);
console.log('--- task ---: ', task);
const answer = await sendTask(token, task.cookie);
console.log('--- answer ---: ', answer);
