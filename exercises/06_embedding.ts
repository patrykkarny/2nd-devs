import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('embedding');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const embedding = new OpenAIEmbeddings({ modelName: 'text-embedding-ada-002' });

const vectors = await embedding.embedQuery('Hawaiian pizza');
console.log('--- vectors ---: ', vectors);

const answer = await sendTask(token, vectors);
console.log('--- answer ---: ', answer);
