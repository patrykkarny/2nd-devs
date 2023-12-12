import { ChatOpenAI } from 'langchain/chat_models/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import {
  BaseMessageChunk,
  HumanMessage,
  SystemMessage,
} from 'langchain/schema';

const token = await authorizeTask('people');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const people = await fetch(task.data).then((res) => res.json());

const findByFullNameSchema = {
  name: 'findByFullName',
  description: 'Find full name of the person in the query',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description:
          'Person name always converted to polish formal version, e.g. "Krysia - Krystyna", "Krzysiek - Krzysztof, "Kasia - Katarzyna", etc.',
      },
      lastName: {
        type: 'string',
        description: 'Person last name',
      },
    },
  },
};

const chatGpt4 = new ChatOpenAI({
  modelName: 'gpt-4-0613',
}).bind({
  functions: [findByFullNameSchema],
  function_call: { name: 'findByFullName' },
});

const result = await chatGpt4.invoke([new HumanMessage(task.question)]);

const parseFunctionCall = (
  result: BaseMessageChunk,
): { name: string; args: any } | null => {
  if (result?.additional_kwargs?.function_call === undefined) {
    return null;
  }
  return {
    name: result.additional_kwargs.function_call.name,
    args: JSON.parse(result.additional_kwargs.function_call.arguments),
  };
};

const action = parseFunctionCall(result);
console.log('--- action ---: ', action);

if (!action) {
  throw new Error('No action found');
}

const findByFullName = (name: string, lastName: string) => {
  const foundPerson = people.find(
    (person) => person.imie === name && person.nazwisko === lastName,
  );

  return foundPerson;
};

const foundPerson = findByFullName(action.args.name, action.args.lastName);

if (!foundPerson) {
  throw new Error('No person found');
}

const chatGpt3 = new ChatOpenAI();
const { content } = await chatGpt3.call([
  new SystemMessage(`
    Na podstawie kontextu ponizej jak najkrócej odpowiedz na pytanie uzytkownika.

    Context:
    ###
    ${Object.entries(foundPerson)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}
    ###

    Answer:
  `),
  new HumanMessage(task.question),
]);
console.log('--- response ---: ', content);

const answer = await sendTask(token, content);
console.log('--- answer ---: ', answer);
