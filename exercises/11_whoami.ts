import { ChatOpenAI } from 'langchain/chat_models/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { SystemMessage } from 'langchain/schema';

let token = await authorizeTask('whoami');
console.log('--- token ---: ', token);

const hints: string[] = [];
const chat = new ChatOpenAI();

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let found = false;

while (!found) {
  let task;

  task = await getTask(token);
  console.log('--- task ---: ', task);

  if (typeof task === 'string') {
    console.log('--- wait 10s ---');
    await wait(10000);

    continue;
  }

  hints.push(task.hint);
  console.log('--- hints ---: ', hints);

  const { content } = await chat.call([
    new SystemMessage(`
      Based on the context below, guess who is the person that is being described.
      If you are unsure, say "no". Only give the person name and last name if you are sure.

      Context:
      ###${hints.join('\n')}###

      Person name:
    `),
  ]);
  const stringifiedContent = content.toString();
  console.log('--- person name ---: ', stringifiedContent);

  if (stringifiedContent.toLowerCase().includes('no')) {
    console.log('--- next iteration ---');
    continue;
  }

  const answer = await sendTask(token, stringifiedContent);
  console.log('--- answer ---: ', answer);

  if (answer.msg === 'OK') {
    found = true;
    break;
  }
}
