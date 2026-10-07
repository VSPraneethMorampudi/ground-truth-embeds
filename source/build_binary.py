import json
d=open("data.js").read();G=json.loads(d[d.index("{"):].strip().rstrip(";"))
geo=json.dumps({"state":G["state"],"districts":[{"n":x["n"],"d":x["d"]} for x in G["districts"]]},separators=(",",":"))
for src,out in (("binary-src.html","../binary.html"),("binary-flat-src.html","../binary-flat.html"),("binary-flat-v9-src.html","../binary-flat-v9.html")):
    open(out,"w").write(open(src).read().replace("/*GEO*/null",geo))
