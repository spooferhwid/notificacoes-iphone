// sw.js

// 1. Definições de Cache
const CACHE_NAME = 'notif-generator-v1';
// Lista de recursos que devem ser pré-carregados (para uso offline)
const FILES_TO_CACHE = [
  './', // A página principal (index.html)
  'index.html',
  'manifest.json',
  'icon1.png', // Ícones para notificação e tela inicial
  'icon192.png',
  'favicon.ico',
  // Se você tivesse um arquivo CSS ou JS separado, eles iriam aqui.
  // Como o CSS/JS está inline no HTML, o 'index.html' já o cobre.
];

// 2. Evento de Instalação (Caching dos Assets)
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Instalação e Pré-caching de Assets.');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Adiciona todos os arquivos necessários ao cache.
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Força o novo SW a assumir o controle
      .catch(err => console.error('[SW] Falha no pré-caching:', err))
  );
});

// 3. Evento de Ativação (Limpeza de Caches Antigos)
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Ativação e Limpeza de Caches Antigos.');
  event.waitUntil(
    caches.keys().then(keyList => {
      // Retorna uma Promise que resolve quando todos os caches antigos forem deletados
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deletando cache antigo:', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => self.clients.claim()) // Assume o controle imediatamente das páginas abertas
  );
});

// 4. Estratégia de Fetch (Cache-First)
// Intercepta todas as requisições para servir primeiro do cache
self.addEventListener('fetch', function(event) {
  // Ignora requisições de extensões ou de outros domínios
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retorna a resposta do cache se encontrada
          if (response) {
            return response;
          }
          // Se não estiver no cache, faz a requisição normal (fetch)
          return fetch(event.request);
        })
    );
  }
});

// 5. Evento de Clique na Notificação (Lógica de Foco/Abertura de Janela)
self.addEventListener('notificationclick', function(event) {
  const clickedNotification = event.notification;
  clickedNotification.close(); // Fecha a notificação

  const urlToOpen = new URL('/', self.location.origin).href; // Abre a URL raiz

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // 1. Tenta focar em uma aba existente com a URL do app
        let matchingClient = windowClients.find(client => {
          return client.url === urlToOpen || client.url.startsWith(self.location.origin);
        });

        if (matchingClient) {
          return matchingClient.focus();
        } else {
          // 2. Se não encontrar, abre uma nova aba
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 6. Evento de Fechamento de Notificação (Opcional, para logs)
self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notificação fechada:', event.notification.tag);
});
