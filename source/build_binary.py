# Builds ../binary.html: inlines the state and district outlines from data.js
import json
d=open("data.js").read();G=json.loads(d[d.index("{"):].strip().rstrip(";"))
geo=json.dumps({"state":G["state"],"districts":[{"n":x["n"],"d":x["d"]} for x in G["districts"]]},separators=(",",":"))
s=open("binary-src.html").read().replace("/*GEO*/null",geo)
open("../binary.html","w").write(s)
