// Stain Solver offline support: network-first pages, cached assets; no analytics.
const VERSION='stainsolver-v3-2026-11-17';
const CORE=['/','/solve/','/guides/','/about/','/privacy/','/assets/css/style.css','/assets/css/experience.css','/assets/img/textile-study.svg','/assets/img/share-card.png','/assets/js/app.js','/assets/js/data.js','/assets/js/engine.js','/assets/img/favicon.svg','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('stainsolver-')&&k!==VERSION).map(k=>caches.delete(k)));await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){const c=await caches.open(VERSION);c.put(event.request,response.clone()).catch(()=>{});}return response;}
      catch {const match=await caches.match(event.request,{ignoreSearch:true});return match||await caches.match('/solve/')||new Response('You are offline. Open Stain Solver again when connected.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}})());return;
  }
  event.respondWith((async()=>{const hit=await caches.match(event.request);if(hit)return hit;
    try{const response=await fetch(event.request);if(response.ok){const c=await caches.open(VERSION);c.put(event.request,response.clone()).catch(()=>{});}return response;}
    catch{return new Response('Offline',{status:503});}})());
});
