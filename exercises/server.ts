import express, { Request, Response, NextFunction } from 'express';

import { ChatOpenAI } from 'langchain/chat_models/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';

// import { OpenAI } from 'langchain/llms/openai';
// import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
// import { RetrievalQAChain } from 'langchain/chains';
// import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { SerpAPILoader } from 'langchain/document_loaders/web/serpapi';

import { transports, format, createLogger } from 'winston';

const { combine, timestamp, printf, colorize, align } = format;

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: 'YYYY-MM-DD hh:mm:ss.SSS A',
    }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
  ),
  transports: [new transports.Console()],
});

const app = express();
app.use(express.json());

const messages: { question: string; answer: string }[] = [];

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ status: 'ok' });
});

router.post('/chat', async (req, res) => {
  const { question } = req.body;
  logger.info(`Received question: ${question}`);

  const chat = new ChatOpenAI({
    modelName: 'gpt-4-0613',
  });

  logger.info(
    `Existing conversation history: ${JSON.stringify(messages, null, 2)}`,
  );

  const result = await chat.invoke([
    new SystemMessage(`Answer the user question. If needed take into account the existing conversation history.
    ### Existing conversation history:
    ${messages
      .map((msg) => `Human: ${msg.question}\nAI: ${msg.answer}`)
      .join('\n')}###
    `),
    new HumanMessage(question),
  ]);
  logger.info(`Answer: ${result.content}`);

  messages.push({
    question,
    answer: result.content as string,
  });

  res.json({ reply: result.content });
});

router.post('/chat/google', async (req, res) => {
  const { question } = req.body;
  logger.info(`Received question: ${question}`);

  const chat = new ChatOpenAI({
    modelName: 'gpt-4-0613',
  });

  const result = await chat.invoke([
    new SystemMessage(`
      Answer the user question. If you don't know the answer, return 0 and nothing else.
    `),
    new HumanMessage(question),
  ]);

  logger.info(`Answer: ${result.content}`);

  if (result.content !== '0') {
    res.json({ reply: result.content });
    return;
  }

  const resultQuery = await chat.invoke([
    new SystemMessage(`
      Rephrase the user question so that it can be used as a Google search query.
      Do not wrap the query in additional quotes, double quotes, wrapping brackets or any other special characters.
    `),
    new HumanMessage(question),
  ]);

  logger.info(`Google query: ${resultQuery.content}`);

  // const llm = new OpenAI({ modelName: 'gpt-4-0613' });
  // const embeddings = new OpenAIEmbeddings();
  const loader = new SerpAPILoader({
    q: resultQuery.content as string,
    apiKey: process.env.SERPAPI_API_KEY,
  });
  const docs = await loader.load();

  logger.info(`Found ${docs.length} documents`);

  // const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  // const chain = RetrievalQAChain.fromLLM(llm, vectorStore.asRetriever());
  const answer = await chat.invoke([
    new SystemMessage(`
      Answer the user question using the context below from google search result in JSON format.
      If the question is related to URL, only return that URL and nothing else.

      context###${docs.map((doc) => doc.pageContent).join('\n\n')}###
    `),
    new HumanMessage(question),
  ]);

  logger.info(`Google answer: ${answer.content}`);

  res.json({ reply: answer.content });
});

router.post('/chat/custom', async (req, res) => {
  const { question } = req.body;
  logger.info(`Received question: ${question}`);

  const chat = new ChatOpenAI({
    modelName: process.env.OPENAI_FT_MODEL,
  });

  const result = await chat.invoke([
    new SystemMessage(`
      Convert the user message from Markdown to HTML.
      Only return the HTML content and nothing else.
      Do not wrap the output in additional quotes, double quotes, wrapping brackets or any other special characters.
    `),
    new HumanMessage(question),
  ]);

  logger.info(`Answer: ${result.content}`);

  res.json({ reply: result.content });
});

app.use('/api', router);
app.use(() => {
  throw new Error('Not found');
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(err);
  const status = error.message === 'Not found' ? 404 : 500;

  res.status(status).json({ error: error.message });
});

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
