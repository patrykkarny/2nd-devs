import { ChatOpenAI } from 'langchain/chat_models/openai';

import { OpenAI } from 'langchain/llms/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { BaseMessageChunk, HumanMessage } from 'langchain/schema';

const token = await authorizeTask('knowledge');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const chat = new ChatOpenAI({
  modelName: 'gpt-4-0613',
}).bind({
  functions: [
    {
      name: 'getCurrency',
      description: 'Get currency',
      parameters: {
        type: 'object',
        properties: {
          currency: {
            type: 'string',
            description: 'Currency code (e.g. USD, EUR, PLN, etc.)',
          },
        },
      },
    },
    {
      name: 'getPopulation',
      description: 'Get population of the country',
      parameters: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Country name in alpha 3 code (e.g. POL, USA, etc.)',
          },
        },
      },
    },
    {
      name: 'getGeneralKnowledge',
      description: 'Get general knowledge',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The general query formatted in detailed way',
          },
        },
      },
    },
  ],
});

const result = await chat.invoke([new HumanMessage(task.question)]);
console.log('--- result ---: ', result.additional_kwargs);

const parseFunctionCall = (
  result: BaseMessageChunk,
): { name: string; args: any } => {
  if (!result?.additional_kwargs?.function_call)
    throw new Error('No action found');

  return {
    name: result.additional_kwargs.function_call.name,
    args: JSON.parse(result.additional_kwargs.function_call.arguments),
  };
};

const action = parseFunctionCall(result);
console.log('--- action ---: ', action);

const actions: Record<string, (args: any) => Promise<string>> = {
  getCurrency: async ({ currency }: { currency: string }) => {
    const response: any = await fetch(
      `http://api.nbp.pl/api/exchangerates/rates/A/${currency}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).then((res) => res.json());

    return `${response.rates[0].mid}`;
  },
  getPopulation: async ({ country }: { country: string }) => {
    const response: any = await fetch(
      `https://restcountries.com/v3.1/alpha/${country}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ).then((res) => res.json());

    return `${response[0].population}`;
  },
  getGeneralKnowledge: async ({ query }: { query: string }) => {
    const openai = new OpenAI();

    const result = await openai.call(query);

    return result;
  },
};

const actionResult = await actions[action.name](action.args);
console.log('--- actionResult ---: ', actionResult);

const answer = await sendTask(token, actionResult);
console.log('--- answer ---: ', answer);
