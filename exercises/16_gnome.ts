import { ChatOpenAI } from 'langchain/chat_models/openai';

import { OpenAI } from 'langchain/llms/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { BaseMessageChunk, HumanMessage } from 'langchain/schema';

const token = await authorizeTask('gnome');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const model = new ChatOpenAI({
  modelName: 'gpt-4-vision-preview',
  verbose: true,
});

const result = await model.invoke([
  new HumanMessage({
    content: [
      { type: 'text', text: task.msg },
      {
        type: 'image_url',
        image_url: {
          url: task.url,
        },
      },
    ],
  }),
]);
console.log('--- result ---: ', result);

const answer = await sendTask(token, result.content);
console.log('--- answer ---: ', answer);
