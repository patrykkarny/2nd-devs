import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('functions');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const addUserSchema = {
  name: 'addUser',
  description: 'Add user to the database',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the user',
      },
      surname: {
        type: 'string',
        description: 'Surname of the user',
      },
      year: {
        type: 'integer',
        description: 'Year of birth of the user',
      },
    },
  },
};

const answer = await sendTask(token, addUserSchema);
console.log('--- answer ---: ', answer);
