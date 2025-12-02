// sw.js

// 1. Definições de Cache (Aumente a versão se mudar FILES_TO_CACHE)
const CACHE_NAME = 'notif-generator-v1';
// Lista de recursos que devem ser pré-carregados (para uso offline)
const FILES_TO_CACHE = [
  './', 
  'index.html',
  'manifest.json',
  'icon1.png', 
  'icon192.png',
  'favicon.ico',
];

// 2. Evento de Instalação (Caching dos Assets)
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Instalação e Pré-caching de Assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) 
      .catch(err => console.error('[SW] Falha no pré-caching:', err))
  );
});

// 3. Evento de Ativação (Limpeza de Caches Antigos)
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Ativação e Limpeza de Caches Antigos.');
  event.waitUntil(
    caches.keys().then(keyList => {
      // Deleta caches que não correspondem ao CACHE_NAME atual
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deletando cache antigo:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim()) 
  );
});

// 4. Estratégia de Fetch (Cache-First)
// Intercepta requisições: tenta servir do cache primeiro, depois da rede.
self.addEventListener('fetch', function(event) {
  // Apenas lida com requisições do nosso domínio (mesma origem)
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Se estiver no cache, retorna a resposta do cache
          if (response) {
            return response;
          }
          // Se não, faz a requisição normal
          return fetch(event.request);
        })
    );
  }
});

// 5. Evento de Clique na Notificação (Lógica de Foco/Abertura de Janela)
self.addEventListener('notificationclick', function(event) {
  const clickedNotification = event.notification;
  clickedNotification.close(); // Sempre fecha a notificação ao clicar

  const urlToOpen = new URL('/', self.location.origin).href; 

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Tenta focar em uma aba aberta que esteja no nosso domínio
        let matchingClient = windowClients.find(client => {
          return client.url === urlToOpen || client.url.startsWith(self.location.origin);
        });

        if (matchingClient) {
          return matchingClient.focus();
        } else {
          // Se não encontrar, abre uma nova aba
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 6. Evento de Fechamento de Notificação (Opcional)
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notificação fechada:', event.notification.tag);
});
