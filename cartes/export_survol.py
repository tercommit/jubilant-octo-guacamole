"""Données du survol 3D de La Réunion (page game/survol.html) à partir du MNT Copernicus GLO-30.

Usage : python cartes/export_survol.py <dossier_tuiles> game/public/assets/reunion
Produit relief.bin (altitudes en décimètres, Uint16 little-endian, ligne 0 = nord), relief.json (dimensions)
et texture.jpg (teintes d'altitude et léger ombrage).
"""
import json
import sys
from pathlib import Path

import numpy as np
from matplotlib.colors import LinearSegmentedColormap, LightSource
import rasterio
from rasterio.merge import merge
from PIL import Image

BBOX = (55.20, -21.40, 55.85, -20.85)  # ouest, sud, est, nord (même cadre que carte_relief.py)
PAS = 4  # 1 point sur 4 : ~120 m entre deux sommets du maillage


def main(dossier_tuiles, sortie):
    sortie = Path(sortie)
    sortie.mkdir(parents=True, exist_ok=True)
    z, transform = merge([rasterio.open(p) for p in sorted(Path(dossier_tuiles).glob("*.tif"))], bounds=BBOX)
    z = np.clip(z[0].astype("float32"), 0, None)
    z[z < 0.5] = 0

    # Maillage : moyenne par blocs de PAS x PAS
    ny, nx = (s // PAS * PAS for s in z.shape)
    bloc = z[:ny, :nx].reshape(ny // PAS, PAS, nx // PAS, PAS).mean(axis=(1, 3))
    (np.round(bloc * 10).astype("<u2")).tofile(sortie / "relief.bin")

    lat = (BBOX[1] + BBOX[3]) / 2
    largeur_km = (BBOX[2] - BBOX[0]) * 111.32 * np.cos(np.radians(lat))
    hauteur_km = (BBOX[3] - BBOX[1]) * 110.54
    (sortie / "relief.json").write_text(json.dumps({
        "colonnes": bloc.shape[1], "lignes": bloc.shape[0], "bbox": BBOX,
        "largeurKm": round(largeur_km, 3), "hauteurKm": round(hauteur_km, 3),
    }, indent=2))

    # Texture : teintes d'altitude, ombrage doux (la lumière de la scène fait le reste)
    terre = LinearSegmentedColormap.from_list("terre", [
        (0.00, "#4f8a3c"), (0.10, "#6fa246"), (0.25, "#b9c56e"),
        (0.45, "#cfae68"), (0.65, "#a8774a"), (0.82, "#8a6a5a"), (1.00, "#f4f1ec")])
    dx = abs(transform.a) * 111320 * np.cos(np.radians(lat))
    dy = abs(transform.e) * 110540
    rgb = LightSource(azdeg=315, altdeg=55).shade(z, cmap=terre, vert_exag=1, dx=dx, dy=dy,
                                                  blend_mode="soft", vmin=0, vmax=float(z.max()), fraction=0.6)
    rgb[z <= 0] = (0.11, 0.37, 0.50, 1.0)  # fond marin : même couleur que le fond marin de Survol.jsx
    img = Image.fromarray((rgb[..., :3] * 255).astype("uint8"))
    img.resize((2048, round(2048 * img.height / img.width)), Image.LANCZOS).save(sortie / "texture.jpg", quality=86)
    print(f"maillage {bloc.shape[1]} x {bloc.shape[0]}, île {largeur_km:.1f} x {hauteur_km:.1f} km")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
