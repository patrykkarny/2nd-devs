import { PromptTemplate } from 'langchain/prompts';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';

import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('liar');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const question = 'What is Prompt Engineering?';
const data = new FormData();
data.append('question', question);

const result = await fetch(`https://zadania.aidevs.pl/task/${token}`, {
  method: 'POST',
  body: data,
}).then((response) => response.json());
console.log('--- result ---: ', result);

const systemTemplate = `
Check of the answer: "{answer}" is related to the question: "{question}".
Your job is to only answer with "yes" or "no" if the answer is correct.
`;

const llm = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0 });
const prompt = PromptTemplate.fromTemplate(systemTemplate);
const chain = new LLMChain({ llm, prompt, verbose: true });

const { text } = await chain.call({
  question,
  answer: result.answer,
});

console.log('--- text ---: ', text);

const answer = await sendTask(token, text);
console.log('--- answer ---: ', answer);
