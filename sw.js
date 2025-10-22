const CACHE_NAME = 'molat-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install Event - کاتی Install کردن
self.addEventListener('install', event => {
  console.log('⚙️ Service Worker Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All files cached');
        return self.skipWaiting(); // یەکسەرەکی چاڵاک بکە
      })
  );
});

// Activate Event - کاتی چاڵاککردن
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Cache ی کۆن بسڕەوە
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // کۆنترۆڵی هەموو لاپەڕەکان
    })
  );
});

// Fetch Event - کاتی وەرگرتنی فایلەکان
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ئەگەر لە Cache دا هەبوو، بیگێڕەوە
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }
        
        // ئەگەر لە Cache دا نەبوو، لە ئینتەرنێتەوە وەربگرە
        console.log('🌐 Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // ئەگەر وەڵامەکە باش بوو، لە Cache دا هەڵیبگرە
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('❌ Fetch failed:', error);
            // ئەگەر ئینتەرنێت نەبوو، پەیامێک پیشان بدە
            return new Response('بێ ئینتەرنێت - تکایە پەیوەندی بە ئینتەرنێتەوە بکەرەوە', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Message Event - بۆ ئەپدەیتی دەستی
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
