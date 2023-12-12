import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('meme');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const renderMemeImage = (url: string, text: string) =>
  fetch('https://get.renderform.io/api/v2/render', {
    method: 'POST',
    headers: {
      'X-API-KEY': process.env.RENDERFORM_API_KEY || '',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template: process.env.RENDERFORM_TEMPLATE_ID || '',
      data: {
        'image.src': url,
        'title.text': text,
      },
    }),
  }).then((response) => response.json());

const imageResponse = await renderMemeImage(task.image, task.text);
console.log('--- imageResponse ---: ', imageResponse);

const answer = await sendTask(token, imageResponse.href);
console.log('--- answer ---: ', answer);
