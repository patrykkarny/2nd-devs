export const checkPrompt = async (message: string) =>
  fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: message,
      model: 'text-moderation-latest',
    }),
  }).then((response) => response.json());

export const fetchApi = async (
  path: string,
  {
    method = 'GET',
    body,
  }: { method?: string; body?: Record<string, unknown> } = {},
) => {
  const response = await fetch(`${process.env.API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...(body && { body: JSON.stringify(body) }),
  }).then((response) =>
    response.headers.get('Content-Type')?.includes('application/json')
      ? response.json()
      : response.text(),
  );

  return response;
};

export async function authorizeTask(name: string) {
  const response = await fetchApi(`/token/${name}`, {
    method: 'POST',
    body: {
      apikey: process.env.PUBLIC_API_KEY,
    },
  });

  return response.token;
}

export async function getTask(token: string) {
  const response = await fetchApi(`/task/${token}`);

  return response;
}

export async function sendTask(token: string, answer: any) {
  const response = await fetchApi(`/answer/${token}`, {
    method: 'POST',
    body: {
      answer,
    },
  });

  return response;
}
