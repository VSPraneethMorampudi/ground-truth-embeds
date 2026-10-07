import json
d=open("data.js").read();G=json.loads(d[d.index("{"):].strip().rstrip(";"))
geo=json.dumps({"state":G["state"],"districts":[{"n":x["n"],"d":x["d"]} for x in G["districts"]]},separators=(",",":"))
for src,out in (("binary-src.html","../binary.html"),("binary-flat-src.html","../binary-flat.html"),("binary-flat-v9-src.html","../binary-flat-v9.html")):
    open(out,"w").write(open(src).read().replace("/*GEO*/null",geo))
# v12 also needs the district centres, the Anganwadi centres and the projection lattice (for real lon/lat)
lt=G["lattice"];lt={k:lt[k] for k in ("lon0","lat0","step","nx","ny","xy")}
geo12=json.dumps({"state":G["state"],"districts":[{"n":x["n"],"d":x["d"],"c":x["c"]} for x in G["districts"]],"aw":G["stack"]["aw"],"lt":lt},separators=(",",":"))
open("../binary-flat-v12.html","w").write(open("binary-flat-v12-src.html").read().replace("/*GEO*/null",geo12))
