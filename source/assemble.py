s=open('src.html').read(); d=open('data.js').read()
open('dist/index.html','w').write(s.replace('<script>/*DATA*/</script>','<script>'+d+'</script>'))
