# 05 — Les cases spéciales

> Statut : brouillon v0.1 · 18/10/2026 · Implémenté dans `game/src/plateau/` (types dans `carte.js`, effets dans `logique.js`)

## Principe

- Chaque case a un **type**, reconnaissable à sa couleur **et** à un symbole (lisible aussi sans voir les couleurs).
- L'effet s'applique seulement quand le joueur **s'arrête** sur la case, pas quand il passe dessus
  (la vanille, elle, s'achète aussi en passant).
- Le joueur ne peut jamais descendre sous 0 zarlor.
- Un message annonce l'effet ; la pause avant le joueur suivant est allongée pour qu'on ait le temps de le lire.

## Les types

| Case | Symbole | Effet |
|---|---|---|
| **Départ** (jaune) | — | rien |
| **Bleue** | + | gagne **3 zarlor** |
| **Rouge** | − | perd **3 zarlor** (« kass la tèt ! ») |
| **Chance** (violette) | étoile | un évènement tiré au sort, toujours favorable (voir plus bas) |
| **Cyclone** (turquoise) | tourbillon | échange sa place avec un autre joueur tiré au sort ; en solo, emporté sur une case au hasard |

Le rebord de la case indique la zone : clair sur la côte, vert sur le Chemin des Hauts.

### Tirages de la case chance

| Évènement | Effet | Poids |
|---|---|---|
| Trouvé sous un galet | +5 zarlor | 4 |
| Gros lot du loto | +10 zarlor | 1 |
| Anniversaire | chaque autre joueur lui donne 2 zarlor (en solo : +5 zarlor) | 2 |
| Le car jaune | déposé 2 cases avant la vanille | 2 |

## Répartition sur le plateau (37 cases)

- **Côte (30 cases)** : départ (0), 6 rouges (3, 8, 12, 17, 21, 26), 3 chances (6, 19, 28),
  2 cyclones (10, 24), le reste en bleu.
- **Chemin des Hauts (7 cases)** : plus court, mais plus risqué : 3 rouges, 1 chance, 3 bleues.

## Paramètres (`game/src/plateau/config.js`)

| Paramètre | Valeur |
|---|---|
| Gain d'une case bleue | 3 |
| Perte d'une case rouge | 3 |
| Pause à l'arrivée sur une case à effet | 1,8 s |
| Tirages de la case chance | tableau `chance` |

## Plus tard

- **Boutique** (« La boutik Sinoi ») : acheter des objets (dé doublé, dé truqué…), avec un inventaire par joueur.
- Une case **mini-jeu duel** et une case **évènement** qui déplace la vanille.
- Animation du cyclone et du car jaune (aujourd'hui, le pion change de case d'un coup).
