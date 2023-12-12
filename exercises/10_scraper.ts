import { ChatOpenAI } from 'langchain/chat_models/openai';

import { authorizeTask, getTask, sendTask } from 'exercises/api';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import {
  PuppeteerWebBaseLoader,
  Page,
  Browser,
} from 'langchain/document_loaders/web/puppeteer';

const token = await authorizeTask('scraper');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const { msg, input, question } = task;

const loader = new PuppeteerWebBaseLoader(input, {
  launchOptions: {
    headless: 'new',
  },
  gotoOptions: {
    waitUntil: 'domcontentloaded',
  },
  evaluate(page: Page, browser: Browser) {
    return page.evaluate(() => {
      // @ts-ignore
      return document.querySelector('pre').innerHTML;
    });
  },
});

const [doc] = await loader.load();
console.log('--- doc ---: ', doc);

const chat = new ChatOpenAI();

const { content } = await chat.call([
  new SystemMessage(`
    ${msg}
    Article: ###${doc.pageContent}###
  `),
  new HumanMessage(question),
]);

console.log('--- question answer ---: ', content);

const answer = await sendTask(token, content);
console.log('--- answer ---: ', answer);
