(function(){
  var SITE=window.location.origin.includes('localhost')||window.location.origin.includes('127.0.0.1')?'http://localhost:3000':'https://aniraku.vercel.app'
  document.addEventListener('DOMContentLoaded',function(){
    var c=document.getElementById('canonical-link');if(c)c.href=SITE+window.location.pathname
    document.querySelectorAll('[id$="-url"],[id$="-image"]').forEach(function(e){e.content=e.content.replace('https://aniraku.vercel.app',SITE)})
  })
})()
