// NOME DO CACHE ATUALIZADO (FORÇA O REFRESH)
const CACHE_NAME = 'tic-tac-toe-v2';

// Arquivos essenciais para o funcionamento offline (o "shell" do app)
const urlsToCache = [
    'tic_tac_toe.html',
    'manifest.json',
    'service-worker.js', // Cacheia a si mesmo
    'https://cdn.tailwindcss.com', 
    'https://em-content.zobj.net/source/apple/354/old-woman_1f475.png', 
    // URLs dos ícones (garante que sejam cacheados)
    'https://placehold.co/192x192/4f46e5/ffffff?text=X+O',
    'https://placehold.co/512x512/4f46e5/ffffff?text=X+O'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    // Força o Service Worker a se ativar imediatamente após a instalação
    self.skipWaiting();
    
    // Abre o cache e adiciona todos os arquivos essenciais
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache v2 aberto, adicionando arquivos essenciais...');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker v2 ativado. Limpando caches antigos.');
    // Deleta caches antigos para que a nova versão do PWA seja carregada
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Só deleta se não for o cache da versão atual
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Permite que o Service Worker ativo comece a controlar os clientes imediatamente
    return self.clients.claim();
});

// Estratégia de Cache-First para buscar recursos
self.addEventListener('fetch', event => {
    // Ignora requisições que não sejam HTTP/HTTPS (como chrome-extension://)
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        // Tenta encontrar a requisição no cache
        caches.match(event.request)
            .then(response => {
                // Se estiver no cache, retorna a versão cacheadas
                if (response) {
                    return response;
                }
                
                // Se não estiver no cache, faz a requisição na rede
                return fetch(event.request).then(
                    networkResponse => {
                        // Verifica se a resposta é válida
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Opcional: Cacha novas requisições em runtime
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return networkResponse;
                    }
                );
            })
    );
});