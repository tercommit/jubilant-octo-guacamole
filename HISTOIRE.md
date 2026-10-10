# Petit Saut : l'histoire et le monde

Document de conception : il sert de référence avant d'ajouter la carte de l'île et les nouvelles missions.
Les noms (l'île de Brumelune, Lyra) sont provisoires.

## Ambiance

Mystérieuse et un peu sombre : une île noyée dans la brume, des couleurs éteintes, une magie
disparue. La fin ramène la lumière.

## Le lore

### L'île de Brumelune

Une île isolée, toujours couverte de brume, découpée en trois régions autour d'un centre :

- **Le centre** : point de départ et **source de soin** (elle remet les vies au maximum).
  C'est le seul endroit du jeu où l'on se soigne.
- **La forêt brumeuse**, à l'ouest
- **Le marais empoisonné**, au sud
- **Le volcan**, au cœur de l'île, accessible en dernier

### Les slimes et leur Roi

Les slimes n'étaient pas des monstres : ils étaient les **gardiens de l'île** et protégeaient la
magie avec les humains. Leur chef, le **Roi des slimes**, a été corrompu. Il s'est retourné contre
les humains et a **volé toute la magie** de l'île. Depuis, la brume s'épaissit et les slimes
attaquent tout ce qui bouge.

### La magicienne (Lyra)

Comme tous les habitants, elle a perdu ses pouvoirs : au début, elle ne sait que sauter. Elle
part reprendre la magie, région après région, et retrouve un pouvoir à chaque mission.

## Les missions

| # | Lieu             | Pouvoir trouvé au début | Dangers                                              |
|---|------------------|-------------------------|------------------------------------------------------|
| 1 | Forêt brumeuse   | 🛡️ Bouclier              | Slimes, piques, premières **pluies de projectiles**  |
| 2 | Marais empoisonné | 💥 Ravageuse            | Pluies de projectiles plus denses, plus d'ennemis    |
| 3 | Volcan           | —                       | Le **Roi des slimes**                                |

Les missions se débloquent dans l'ordre sur la carte de l'île. Chaque pouvoir se ramasse
**au début** de sa mission : le reste du niveau apprend à s'en servir. Une fois ramassé, il est acquis.

### Mission 1 : la forêt brumeuse (faite)

Le bouclier est posé juste après le départ. Viennent ensuite quatre zones de pluie, de plus en
plus difficiles :

1. sur un terrain plat, pour apprendre ;
2. avec un slime et des piques sous la pluie ;
3. une longue pluie, avec un abri en briques au milieu pour attendre la recharge ;
4. une pluie au-dessus d'un champ de piques, avec une plate-forme pour passer par en haut.

### Mission 2 : le marais empoisonné (faite)

La ravageuse est posée au départ. Juste après, un **gardien de pierre** bouche un tunnel : seule
la ravageuse le détruit. Le reste du niveau propose des **slimes à piques** (on ne peut pas les
écraser), des mares de poison, un nid de slimes sous la pluie et des plates-formes au-dessus du
poison.

### Mission 3 : le volcan (faite)

Un court passage au-dessus de la lave, puis l'arène du Roi des slimes.

### Lanternes

Des lanternes servent de **points de reprise** : après une mort, on repart de la dernière lanterne
allumée. Sans elles, il faudrait relancer la ravageuse (et perdre une vie) à chaque essai.

## Les pouvoirs

### 🛡️ Bouclier (mission 1)

- **2 s** d'invincibilité totale, puis **4 s** de recharge (touche X, bouton B sur mobile).
- Protège des ennemis, des piques et des projectiles, mais pas des chutes dans le vide,
  du poison ni de la lave.
- Sert surtout contre les **pluies de projectiles**, impossibles à esquiver entièrement.
- Le bouclier clignote pendant sa dernière demi-seconde. Une jauge en haut à gauche montre sa
  durée, puis sa recharge.

### 💥 Ravageuse (mission 2)

- Tue **instantanément tous les ennemis à l'écran**.
- Coûte **1 vie** à chaque utilisation.
- Peut être lancée **même avec la dernière vie**, mais la magicienne y laisse sa dernière
  force : les ennemis meurent, elle aussi, et **le niveau est perdu**.
  Exception : le combat contre le Roi (voir la fin alternative).
- C'est le **seul moyen de vaincre le Roi des slimes**.
- Touche C, bouton R sur mobile. L'icône clignote en rouge quand il ne reste qu'une vie.

### Vies

- 3 vies au départ.
- On ne les récupère **qu'à la source de soin**, sur la carte de l'île.
  Il faut donc revenir s'y soigner avant de repartir en mission.

## Le combat contre le Roi des slimes

1. Le Roi est protégé par une **carapace de slime** : la ravageuse n'a aucun effet tant
   qu'elle est en place.
2. Il fait trois bonds vers Lyra. On peut rebondir sur sa tête, mais ça ne le blesse pas.
3. Il brille en violet, puis fait tomber une **pluie de slime sur toute l'arène**.
   Le bouclier permet d'y survivre, à condition de bien choisir le moment.
4. Il s'essouffle et **ouvre sa garde** pendant un peu plus de 3 secondes.
5. Une **ravageuse** à ce moment-là l'achève **en un seul coup**. Sinon, le cycle recommence.

Si la ravageuse est lancée hors de ce moment, la vie est perdue sans effet sur le Roi.

## Les fins

### Fin normale : le gardien retrouvé

Le Roi est vaincu alors que la magicienne a encore au moins une vie après la ravageuse.

La ravageuse brise la corruption qui possédait le Roi. Il redevient le **gardien bienveillant**
de l'île, rend la magie, la brume se lève et les slimes redeviennent amicaux.

### Fin alternative : le sacrifice

Le Roi est achevé par une ravageuse lancée **avec la dernière vie**.

Le Roi est libéré et la magie revient, mais la magicienne a donné ses dernières forces.
Dernière scène : sous un ciel enfin dégagé, les villageois et les slimes se rassemblent pour
**l'enterrement de la magicienne**, qui s'est sacrifiée pour le peuple de l'île.

## La carte de l'île (faite, voir `world.js`)

- Vue de dessus, style Pokémon, déplacement case par case dans les 4 directions.
- Carte écrite en texte, comme les niveaux (légende à définir dans `world.js`).
- Une entrée par mission. Les entrées verrouillées sont bloquées par la brume (ou un rocher).
- En fin de mission, retour sur la carte au lieu de passer directement au niveau suivant.
- Sauvegarde : missions terminées, pouvoirs obtenus, position sur la carte.
- Sur mobile : ajouter un bouton ▼ et un bouton « Entrer ».
