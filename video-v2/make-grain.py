# Generates the 8 film-grain frames used by the overlay (assets/grain0..7.png)
import numpy as np
from PIL import Image
rng = np.random.default_rng(3)
for i in range(8):
    a = rng.normal(128, 40, (540, 960)).clip(0, 255).astype('uint8')
    Image.fromarray(a, 'L').save(f'assets/grain{i}.png')
