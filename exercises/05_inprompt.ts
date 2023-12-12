import { ChatOpenAI } from 'langchain/chat_models/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { HumanMessage, SystemMessage } from 'langchain/schema';

const token = await authorizeTask('inprompt');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const { input, question } = task;

const chat = new ChatOpenAI();

const { content: personName } = await chat.call([
  new SystemMessage(`
    Return the name of the person used in the question.
    Question ###${question}###
    Person name:
  `),
]);

console.log('--- person name ---: ', personName.toString());

const personMessages = input.filter((message: string) =>
  message.trim().toLowerCase().includes(personName.toString().toLowerCase()),
);

const { content: personAnswer } = await chat.call([
  new SystemMessage(`
    Odpowiedz na pytanie uywająć poniszego contextu. Jeśli nie znasz odpowiedzi, napisz "nie wiem".
    context###${personMessages.join('\n')}###
  `),
  new HumanMessage(question),
]);

console.log('--- question answer ---: ', personAnswer);

const answer = await sendTask(token, personAnswer.toString());
console.log('--- answer ---: ', answer);
