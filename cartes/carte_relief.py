"""Carte du relief de La Réunion à partir du MNT Copernicus GLO-30 (30 m).

Usage : python cartes/carte_relief.py <dossier_tuiles> <dossier_sortie>
Tuiles : https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_{S21,S22}_00_E055_00_DEM/...
"""
import sys
from pathlib import Path

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, LightSource
import rasterio
from rasterio.merge import merge
from PIL import Image

BBOX = (55.20, -21.40, 55.85, -20.85)  # ouest, sud, est, nord

SOMMETS = [
    ("Piton des Neiges", 55.4775, -21.0995),
    ("Piton de la Fournaise", 55.7135, -21.2440),
    ("Grand Bénare", 55.4215, -21.1163),
    ("Cirque de Mafate", 55.430, -21.060),
    ("Cirque de Salazie", 55.525, -21.050),
    ("Cirque de Cilaos", 55.470, -21.140),
    ("Plaine des Cafres", 55.580, -21.215),
]
VILLES = [
    ("Saint-Denis", 55.4504, -20.8823),
    ("Saint-Pierre", 55.4781, -21.3393),
    ("Saint-Paul", 55.2700, -21.0096),
    ("Saint-Benoît", 55.7128, -21.0340),
    ("Le Port", 55.2925, -20.9370),
    ("Saint-Joseph", 55.6190, -21.3780),
]


def main(dossier_tuiles, sortie):
    sortie = Path(sortie)
    sortie.mkdir(parents=True, exist_ok=True)
    tuiles = [rasterio.open(p) for p in sorted(Path(dossier_tuiles).glob("*.tif"))]
    z, transform = merge(tuiles, bounds=BBOX)
    z = z[0].astype("float32")
    z[z < 0.5] = 0  # le MNT Copernicus met la mer à ~0

    # Résolution en mètres (approx. à -21°) pour l'ombrage
    dx = abs(transform.a) * 111320 * np.cos(np.radians(21.1))
    dy = abs(transform.e) * 110540
    mer = z <= 0

    # Teintes hypsométriques
    terre = LinearSegmentedColormap.from_list("terre", [
        (0.00, "#4f8a3c"), (0.10, "#7fae4e"), (0.25, "#c9cf7a"),
        (0.45, "#d8b46a"), (0.65, "#a8774a"), (0.82, "#8a6a5a"),
        (1.00, "#f4f1ec")])
    zmax = float(z.max())
    ls = LightSource(azdeg=315, altdeg=40)
    rgb = ls.shade(z, cmap=terre, vert_exag=1.5, dx=dx, dy=dy,
                   blend_mode="soft", vmin=0, vmax=zmax)
    rgb[mer] = (0.62, 0.78, 0.88, 1.0)

    ouest, sud, est, nord = BBOX
    etendue = (ouest, est, sud, nord)
    aspect = 1 / np.cos(np.radians(21.1))

    fig, ax = plt.subplots(figsize=(13, 11.5), dpi=150)
    ax.imshow(rgb, extent=etendue, aspect=aspect, interpolation="bilinear")
    lon = np.linspace(ouest, est, z.shape[1])
    lat = np.linspace(nord, sud, z.shape[0])
    niv = np.arange(500, 3100, 500)
    cs = ax.contour(lon, lat, z, levels=niv, colors="k", linewidths=0.35, alpha=0.45)
    ax.clabel(cs, fmt="%d m", fontsize=6, inline=True)
    ax.contour(lon, lat, z, levels=[1], colors="#2d5f7a", linewidths=0.8)

    for nom, x, y in SOMMETS:
        iy = int((nord - y) / (nord - sud) * (z.shape[0] - 1))
        ix = int((x - ouest) / (est - ouest) * (z.shape[1] - 1))
        texte = nom
        if nom.startswith(("Piton", "Grand")):
            win = z[max(iy-15, 0):iy+15, max(ix-15, 0):ix+15]
            texte = f"{nom}\n{int(win.max())} m"
            ax.plot(x, y, "^", color="#5a1e10", ms=7)
        decalage = (-75, -22) if nom == "Grand Bénare" else (5, 4)
        ax.annotate(texte, (x, y), xytext=decalage, textcoords="offset points",
                    fontsize=8.5, fontstyle="italic" if "Cirque" in nom or "Plaine" in nom else "normal",
                    fontweight="bold", color="#3a2a20")
    for nom, x, y in VILLES:
        ax.plot(x, y, "o", color="#b02020", ms=4, mec="white", mew=0.8)
        ax.annotate(nom, (x, y), xytext=(4, -10), textcoords="offset points",
                    fontsize=8, color="#202020")

    sm = plt.cm.ScalarMappable(cmap=terre, norm=plt.Normalize(0, zmax))
    cb = fig.colorbar(sm, ax=ax, shrink=0.55, pad=0.02)
    cb.set_label("Altitude (m)")
    ax.set_title("La Réunion — relief (MNT Copernicus GLO-30)", fontsize=15, pad=12)
    ax.set_xlabel("Longitude (°E)")
    ax.set_ylabel("Latitude (°)")
    ax.text(0.01, 0.01, "Données : Copernicus DEM GLO-30 © DLR / Airbus, ESA",
            transform=ax.transAxes, fontsize=7, color="#333")
    fig.savefig(sortie / "reunion-relief.png", bbox_inches="tight")

    # Heightmap 16 bits (0 = mer, 65535 = point culminant) pour un usage 3D
    h = (z / zmax * 65535).astype("uint16")
    Image.fromarray(h).save(sortie / "reunion-heightmap-16bit.png")
    Image.fromarray((z / zmax * 255).astype("uint8")).resize(
        (1024, int(1024 * z.shape[0] / z.shape[1] / aspect))).save(sortie / "reunion-heightmap-1024.png")
    print(f"grille {z.shape}, altitude max {zmax:.0f} m")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
