import { ChatOpenAI } from 'langchain/chat_models/openai';

import { OpenAI } from 'langchain/llms/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { BaseMessageChunk, HumanMessage } from 'langchain/schema';

const token = await authorizeTask('tools');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const model = new ChatOpenAI({
  modelName: 'gpt-4-0613',
  verbose: true,
}).bind({
  functions: [
    {
      name: 'categorizeTask',
      description:
        'Categorize task - decide whether the task should be added to the todo list or to the calendar when the time is provided',
      parameters: {
        type: 'object',
        properties: {
          tool: {
            type: 'string',
            description: 'The name of the tool',
            enum: ['ToDo', 'Calendar'],
          },
          desc: {
            type: 'string',
            description:
              'The task description formatted in a short and concrete way',
          },
          date: {
            type: 'string',
            description: `The date of the task in the format YYYY-MM-DD. Applicable only if the task is categorized as Calendar. The current date: ${new Date().toLocaleDateString(
              'en-US',
              {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              },
            )}`,
          },
        },
        required: ['tool', 'desc'],
      },
    },
  ],
});

const result = await model.invoke([new HumanMessage(task.question)]);
console.log('--- result ---: ', result.additional_kwargs);

const answer = await sendTask(
  token,
  JSON.parse(result.additional_kwargs.function_call?.arguments || '{}'),
);
console.log('--- answer ---: ', answer);
