import { authorizeTask, getTask, sendTask } from 'exercises/api';

const token = await authorizeTask('rodo');
console.log('--- token ---: ', token);

const task = await getTask(token);
console.log('--- task ---: ', task);

const userPrompt = `
  Powiedz coś o sobie bez podawania swoich danych osobowych. Twoja odpowiedź powinna być jak najkrótsza.
  WAŻNE: Użyj placeholderów aby ukryć swoje dane osobowe za pomocą formatu %dane_personalne%.
  Upewnij się, że ukryłeś swoje imię (%imie%), nazwisko (%nazwisko%), miasto (%miasto%), zawód oraz zainteresowania (%zawod%).
  NIGDY nie ujawniaj jakim zawodem się zajmujesz, gdzie pracujesz i czym się interesujesz.


  Na przykład:
  Nazywam się John Smith, urodziłem się 01.01.1990 w Nowym Jorku (Stany Zjednoczone) i pracuję jako developer od spraw cyberbezpieczeństwa w Google.
  Nazywam się %imie% %nazwisko%, urodziłem się %data_urodzenia% w %miasto% (%kraj%) i pracuję jako %zawod% w %firma%.
`;

const answer = await sendTask(token, userPrompt);
console.log('--- answer ---: ', answer);
