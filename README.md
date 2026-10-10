# Brumelune : la traversée

Nouveau projet de jeu contemplatif, jouable dans le navigateur, qui se contrôle en **inclinant le
téléphone** (gyroscope). Il reprend l'univers et la magicienne de l'ancien jeu.

**Page actuelle :** https://tercommit.github.io/jubilant-octo-guacamole/

Pour l'instant, la page est un **test du gyroscope** : on y vérifie l'autorisation, la réception
des mesures et la calibration, et on guide Lyra pour attraper des lucioles.

## Le test du gyroscope

1. Toucher **Commencer**. Sur iPhone, Safari demande l'accès aux mouvements : accepter.
2. Garder le téléphone immobile pendant la calibration : la position où l'on tient le téléphone
   devient la position neutre (assis, allongé, peu importe).
3. Pencher le téléphone : Lyra glisse dans ce sens, comme une bille.

Le panneau **Infos** affiche quatre voyants (autorisation, mesures par seconde, calibration,
inclinaison), les angles bruts et la position neutre. Le niveau à bulle, en bas à droite, montre
l'inclinaison.

- **Recalibrer** : bouton, appui long d'une seconde n'importe où sur la scène, ou touche C.
- **Inverser G/D, Inverser H/B** : au cas où un axe partirait dans le mauvais sens sur un appareil.
- **Sans gyroscope** (accès refusé, ordinateur) : glisser le doigt n'importe où, ou flèches du clavier.
- Si l'accès a été refusé sur iPhone : Réglages › Safari › Avancé › Données des sites web,
  supprimer celles du site, puis recharger la page.

Le jeu calcule la direction de la gravité vue depuis l'écran plutôt que d'utiliser les angles
bruts : il n'y a pas de saut quand on tient le téléphone presque à la verticale, et la
rotation portrait/paysage est prise en compte.

## Fichiers

- `index.html` : la page de test (tout le code est dans le fichier)
- `player.png` : la planche d'images de la magicienne
- `archive/` : l'ancien jeu, **Petit Saut** (plate-forme, île de Brumelune, Roi des slimes),
  conservé tel quel et toujours jouable sur https://tercommit.github.io/jubilant-octo-guacamole/archive/

## Publier avec GitHub Pages

Settings → Pages → *Deploy from a branch* → branche `main`, dossier `/ (root)` → Save.

## Licence

Le code est placé dans le domaine public sous
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.fr). Voir `LICENSE`.

**Exception :** la magicienne (`player.png`) n'est pas couverte par CC0. Elle est tirée du pack
« sample (idle & walk) » publié sur itch.io (fichier 16345894 du projet 4245635), retournée pour
regarder vers la droite. Elle reste soumise à la licence choisie par son auteur ou autrice.
