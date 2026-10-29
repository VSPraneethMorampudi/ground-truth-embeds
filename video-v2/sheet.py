import sys
from PIL import Image, ImageDraw
d=sys.argv[1]; ts=sys.argv[2].split(','); cols=4
W,H=480,270; S=Image.new('RGB',(W*cols,H*((len(ts)+cols-1)//cols))); dr=ImageDraw.Draw(S)
for i,t in enumerate(ts):
  im=Image.open(f'{d}/{t}.jpg'); im.thumbnail((W,H)); S.paste(im,((i%cols)*W,(i//cols)*H)); dr.text(((i%cols)*W+5,(i//cols)*H+3),t,fill='yellow')
S.save(sys.argv[3],quality=82)
