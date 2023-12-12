import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

import { authorizeTask, getTask, sendTask } from 'exercises/api';

import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const token = await authorizeTask('search');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-ada-002',
});
const embeddedQuery = await embeddings.embedQuery(task.question);

const collectionName = 'unknown_news';
const qdrant = new QdrantClient({ url: process.env.QDRANT_URL });

const collections = await qdrant.getCollections();
console.log('--- collections ---: ', collections);

const foundCollection = collections.collections.find(
  (collection) => collection.name === collectionName,
);

if (!foundCollection) {
  await qdrant.createCollection(collectionName, {
    vectors: { size: 1536, distance: 'Cosine', on_disk: true },
  });
}

const collection = await qdrant.getCollection(collectionName);
console.log('--- collection ---: ', collection);

if (!collection.points_count) {
  const filename = 'archiwum.json';
  const filepath = path.join(__dirname, filename);

  if (!fs.existsSync(filepath)) {
    console.log('--- file does not exist ---');

    const response = await fetch('https://unknow.news/archiwum.json');
    const data = await response.json();

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  const points = await Promise.all(
    data.slice(0, 500).map(async (item) => {
      const query = `${item.title} ${item.info}`;
      const embedding = await embeddings.embedQuery(query);
      const uuid = uuidv4();

      return {
        id: uuid,
        payload: {
          uuid,
          source: collectionName,
          ...item,
        },
        vector: embedding,
      };
    }),
  );

  await qdrant.upsert(collectionName, {
    wait: true,
    batch: {
      ids: points.map((point) => point.id),
      vectors: points.map((point) => point.vector),
      payloads: points.map((point) => point.payload),
    },
  });
}

const search = await qdrant.search(collectionName, {
  vector: embeddedQuery,
  limit: 1,
  filter: {
    must: [
      {
        key: 'source',
        match: {
          value: collectionName,
        },
      },
    ],
  },
});
console.log('--- search ---: ', search);

const answer = await sendTask(token, search[0].payload.url);
console.log('--- answer ---: ', answer);
