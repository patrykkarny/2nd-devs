import fs from 'fs';
import path from 'path';
import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { SystemMessage } from 'langchain/schema';

const token = await authorizeTask('optimaldb');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const filename = 'optimaldb.json';
const filepath = path.join(__dirname, filename);

if (!fs.existsSync(filepath)) {
  const db = await fetch(task.database).then((response) => response.json());
  const chat = new ChatOpenAI({
    modelName: 'gpt-4-0613',
  }).bind({
    functions: [
      {
        name: 'summarize',
        description:
          'Summarize the text and separate each sentence that ends with dot (.) into separate list item.',
        parameters: {
          type: 'object',
          properties: {
            sentences: {
              type: 'array',
              description: 'List of summarized sentences',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    ],
    function_call: { name: 'summarize' },
  });

  const optimalDbEntries = await Promise.all(
    Object.entries(db).map(async ([name, descriptions]) => {
      const descriptionsLength = descriptions.length;
      const groupSize = Math.ceil(descriptionsLength / 3);
      const groups = [];

      for (let i = 0; i < descriptionsLength; i += groupSize) {
        groups.push(descriptions.slice(i, i + groupSize));
      }

      const optimizedDescriptions = await Promise.all(
        groups.map(async (group) => {
          const result = await chat.invoke([
            new SystemMessage(
              `Summarize the following text about the person ${name}.
              Do not lose any important information about the person.
              The summarized text should be more than 4 times shorter than the original text.
              The summarized text should be in Polish language.

              Text:
              ### ${group.join('\n')} ###`,
            ),
          ]);
          console.log('--- result ---: ', result);

          return JSON.parse(
            result.additional_kwargs.function_call?.arguments ||
              '{ "sentences": [] }',
          ).sentences;
        }),
      );

      return [name, optimizedDescriptions.flat()];
    }),
  );

  const optimalDb = optimalDbEntries.reduce(
    (acc, [name, descriptions]) => ({ ...acc, [name]: descriptions }),
    {},
  );

  fs.writeFileSync(filepath, JSON.stringify(optimalDb, null, 2));
}

const answer = await sendTask(token, fs.readFileSync(filepath, 'utf-8'));
console.log('--- answer ---: ', answer);
