const CACHE_NAME = 'todo-pwa-v1';

const ARQUIVOS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomes) => {
      return Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  evento.respondWith(
    caches.match(evento.request).then((respostaCache) => {
      if (respostaCache) {
        return respostaCache;
      }

      return fetch(evento.request).then((respostaRede) => {
        if (!respostaRede || respostaRede.status !== 200) {
          return respostaRede;
        }

        const respostaClonada = respostaRede.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(evento.request, respostaClonada);
        });

        return respostaRede;
      });
    })
  );
});