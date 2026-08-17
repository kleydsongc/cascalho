const CACHE_NAME = 'cascalho-v1';

const ASSETS_TO_CACHE = [
	'./',
	'./index.html',
	'./src/dividas.html',
	'./src/receber.html',
	' ',
	' ',
	' ',
	' ',
	' ',
	' ',
];const CACHE_NAME = 'cascalho-v1';

// Lista de arquivos atualizada conforme a estrutura exata do seu projeto
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './src/dividas.html',
  './src/receber.html',
  './src/config.html',
  './assets/styles/global.css',
  './scripts/script.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Idiqlat:wght@200;300;400&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=arrow_right,arrow_left,currency_exchange,savings,settings,home,edit_square'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});