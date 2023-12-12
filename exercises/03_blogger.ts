import { PromptTemplate } from 'langchain/prompts';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { LLMChain } from 'langchain/chains';

import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('blogger');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const systemTemplate = `
As a Content Manager who manages website about pizza receipts, write a blog post about making a Margherita pizza.
The post should be written in polish language and should include only the outline as listed within the context below.
Make sure to separate each section and include the outline title on top of each.

context###{context}###

Return the answer in JSON format with the example structure:
{format}
`;

const llm = new ChatOpenAI({ modelName: 'gpt-4', temperature: 0.5 });
const prompt = PromptTemplate.fromTemplate(systemTemplate);
const chain = new LLMChain({ llm, prompt, verbose: true });

const { text } = await chain.call({
  context: task.blog.join(', '),
  format: `
    { answer: ["text of section 1", "text of section 2", "text of section 3"] }
  `,
});

const result = JSON.parse(text);
console.log('--- result ---: ', result);

const answer = await sendTask(token, result.answer);
console.log('--- answer ---: ', answer);
