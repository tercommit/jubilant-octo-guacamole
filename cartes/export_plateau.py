"""Île du plateau de jeu à partir du MNT Copernicus GLO-30 : relief low poly, cases de la côte et Chemin des Hauts.

Usage : python cartes/export_plateau.py <dossier_tuiles> game/src/plateau/ile.json
1 unité de jeu = KM_PAR_UNITE km ; l'altitude est exagérée (EXAGERATION) pour lire le relief.
"""
import json
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.merge import merge
from PIL import Image
from scipy import ndimage
from contourpy import contour_generator

BBOX = (55.19, -21.41, 55.86, -20.84)  # ouest, sud, est, nord
KM_PAR_UNITE = 2.4
EXAGERATION = 4
PAS_GRILLE = 0.25  # unités entre deux sommets du relief
SOL = 0.08  # hauteur du rivage au-dessus de la mer
RECUL_COTE_KM = 2.6  # la boucle des cases suit la côte à cette distance dans les terres
N_COTE = 30
FOURCHE = 4  # le Chemin des Hauts part de la 5e case (Saint-Pierre)

LAT0 = (BBOX[1] + BBOX[3]) / 2
LON0 = (BBOX[0] + BBOX[2]) / 2
KX = 111.32 * np.cos(np.radians(LAT0)) / KM_PAR_UNITE
KZ = 110.54 / KM_PAR_UNITE


def unites(lon, lat):
    return np.array([(lon - LON0) * KX, (LAT0 - lat) * KZ])


SAINT_PIERRE = unites(55.4781, -21.3393)
SAINT_BENOIT = unites(55.7128, -21.0340)
# Route des Plaines : Le Tampon, Bourg-Murat (Plaine des Cafres), col de Bellevue, Plaine des Palmistes
ROUTE_DES_PLAINES = [unites(55.517, -21.278), unites(55.567, -21.21), unites(55.586, -21.17), unites(55.627, -21.135)]


def reechantillonner(points, n, ferme=False):
    pts = np.vstack([points, points[:1]]) if ferme else points
    s = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(pts, axis=0).T))])
    cibles = np.linspace(0, s[-1], n, endpoint=not ferme)
    return np.column_stack([np.interp(cibles, s, pts[:, 0]), np.interp(cibles, s, pts[:, 1])]), s[-1]


def main(dossier_tuiles, sortie):
    z, transform = merge([rasterio.open(p) for p in sorted(Path(dossier_tuiles).glob("*.tif"))], bounds=BBOX)
    z = z[0].astype("float32")
    terre = z > 0.5
    etiquettes, _ = ndimage.label(terre)
    terre = etiquettes == np.bincount(etiquettes.ravel())[1:].argmax() + 1  # l'île seule, sans les îlots
    z = np.where(terre, z, 0)
    px_km = (abs(transform.e) * 110.54, abs(transform.a) * 111.32 * np.cos(np.radians(LAT0)))

    def pixels_vers_unites(lignes, colonnes):
        lon = BBOX[0] + (colonnes + 0.5) * abs(transform.a)
        lat = BBOX[3] - (lignes + 0.5) * abs(transform.e)
        return np.column_stack(unites(lon, lat))

    # Boucle de la côte : ligne à distance constante du rivage, lissée
    dans_terres = ndimage.distance_transform_edt(terre, sampling=px_km)
    lignes = contour_generator(z=dans_terres).lines(RECUL_COTE_KM)
    boucle = max(lignes, key=len)
    boucle = pixels_vers_unites(boucle[:, 1], boucle[:, 0])
    boucle, _ = reechantillonner(boucle, 600, ferme=True)
    noyau = np.ones(31) / 31
    boucle = np.column_stack([np.convolve(np.r_[boucle[-15:, k], boucle[:, k], boucle[:15, k]], noyau, "valid") for k in (0, 1)])
    # Sens : de Saint-Pierre, on part vers l'est (Saint-Joseph)
    i_sp = np.argmin(np.hypot(*(boucle - SAINT_PIERRE).T))
    if boucle[(i_sp + 10) % len(boucle), 0] < boucle[i_sp, 0]:
        boucle = boucle[::-1]
        i_sp = len(boucle) - 1 - i_sp
    boucle = np.roll(boucle, -(i_sp - FOURCHE * len(boucle) // N_COTE), axis=0)
    cote, longueur = reechantillonner(boucle, N_COTE, ferme=True)
    rejoint = int(np.argmin(np.hypot(*(cote - SAINT_BENOIT).T)))

    # Chemin des Hauts : de la fourche à la case de Saint-Benoît par la route des Plaines (Catmull-Rom)
    ctrl = np.array([cote[FOURCHE], *ROUTE_DES_PLAINES, cote[rejoint]])
    ctrl = np.vstack([2 * ctrl[0] - ctrl[1], ctrl, 2 * ctrl[-1] - ctrl[-2]])
    courbe = []
    for i in range(1, len(ctrl) - 2):
        p0, p1, p2, p3 = ctrl[i - 1:i + 3]
        for t in np.linspace(0, 1, 40, endpoint=False):
            courbe.append(0.5 * (2 * p1 + (p2 - p0) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t**2 + (3 * p1 - p0 - 3 * p2 + p3) * t**3))
    courbe = np.array(courbe + [ctrl[-2]])
    _, l_hauts = reechantillonner(courbe, 2)
    n_hauts = round(l_hauts / (longueur / N_COTE)) - 1
    hauts = reechantillonner(courbe, n_hauts + 2)[0][1:-1]

    # Relief : moyenne par blocs (terre seule), fond marin qui descend avec la distance au rivage
    largeur, hauteur = (BBOX[2] - BBOX[0]) * KX, (BBOX[3] - BBOX[1]) * KZ
    colonnes, lignes_g = int(largeur / PAS_GRILLE) + 1, int(hauteur / PAS_GRILLE) + 1
    taille = (colonnes, lignes_g)
    reduire = lambda a: np.asarray(Image.fromarray(a.astype("float32")).resize(taille, Image.BOX))
    part_terre = reduire(terre)
    alt = reduire(z) / np.maximum(part_terre, 1e-6)
    au_large = reduire(ndimage.distance_transform_edt(~terre, sampling=px_km))
    y = np.where(part_terre >= 0.5,
                 SOL + alt / 1000 / KM_PAR_UNITE * EXAGERATION,
                 -0.04 - 1.16 * np.clip(au_large / 4, 0, 1) ** 0.8)
    y[:2, :] = y[-2:, :] = y[:, :2] = y[:, -2:] = -1.2  # bord de grille au niveau du grand large

    arrondi = lambda a: np.round(a, 2).tolist()
    Path(sortie).write_text(json.dumps({
        "source": "Copernicus DEM GLO-30, généré par cartes/export_plateau.py",
        "kmParUnite": KM_PAR_UNITE, "exageration": EXAGERATION, "sol": SOL,
        "grille": {"colonnes": colonnes, "lignes": lignes_g, "x0": round(-largeur / 2, 3), "z0": round(-hauteur / 2, 3),
                   "pas": round(largeur / (colonnes - 1), 4), "pasZ": round(hauteur / (lignes_g - 1), 4), "y": arrondi(y.ravel())},
        "cote": arrondi(cote), "hauts": arrondi(hauts), "fourche": FOURCHE, "rejoint": rejoint,
    }, separators=(",", ":")))
    print(f"grille {colonnes}x{lignes_g}, côte {longueur:.1f} u (pas {longueur / N_COTE:.2f}), "
          f"hauts {n_hauts} cases ({l_hauts:.1f} u), rejoint {rejoint}, y max {y.max():.2f}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
