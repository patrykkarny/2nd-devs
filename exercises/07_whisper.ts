import fs from 'fs';
import path from 'path';

import { OpenAIWhisperAudio } from 'langchain/document_loaders/fs/openai_whisper_audio';

import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('whisper');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const filePath = path.join(__dirname, 'mateusz.mp3');
const loader = new OpenAIWhisperAudio(filePath);

const audioToText = await loader.load();
console.log('--- audioToText ---: ', audioToText);

// const outputPath = path.join(__dirname, 'transkrypt.txt');
// fs.writeFileSync(outputPath, audioToText[0].pageContent);

const answer = await sendTask(token, audioToText[0].pageContent);
console.log('--- answer ---: ', answer);
