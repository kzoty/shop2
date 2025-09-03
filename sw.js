const CACHE_NAME = 'padaria-pdv-v1';
const BASE_PATH = '/shop2/';

const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'styles.css',
  BASE_PATH + 'script.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  // Só cachear requisições do nosso domínio
  if (event.request.url.startsWith('https://kzoty.github.io')) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Retorna do cache se encontrou, senão faz fetch
          if (response) {
            return response;
          }
          return fetch(event.request).then(function(response) {
            // Não cachear respostas que não sejam bem-sucedidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona a resposta para cachear
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          });
        })
    );
  } else {
    // Para requisições externas, apenas fetch
    event.respondWith(fetch(event.request));
  }
});