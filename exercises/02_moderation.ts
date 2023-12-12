import { authorizeTask, getTask, sendTask, checkPrompt } from 'exercises/api';

const token = await authorizeTask('moderation');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const results = await Promise.all(
  task.input.map(async (message: string) => {
    const result = await checkPrompt(message);

    return Number(result.results[0].flagged);
  }),
);
console.log('--- results ---: ', results);

const answer = await sendTask(token, results);
console.log('--- answer ---: ', answer);
