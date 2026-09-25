s=open('src4.html').read();d=open('data.js').read();sp=open('sprite4.txt').read()
import time
s=s.replace('/*JOURNEY_CSS*/',open('journey.css').read()).replace('/*JOURNEY_JS*/',open('journey.js').read())
s=s.replace('__BUILD__',str(int(time.time())))
s=s.replace('<!--SPRITE-->',sp).replace('<script>/*DATA*/</script>','<script>'+d+'</script>')
import os;os.makedirs('dist4/fonts',exist_ok=True);open('dist4/index.html','w').write(s)
