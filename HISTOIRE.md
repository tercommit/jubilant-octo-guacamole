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

| # | Lieu             | Dangers                                              | Récompense       |
|---|------------------|------------------------------------------------------|------------------|
| 1 | Forêt brumeuse   | Slimes, piques, premières **pluies de projectiles**  | 🛡️ Bouclier       |
| 2 | Marais empoisonné | Pluies de projectiles plus denses, plus d'ennemis   | 💥 Ravageuse      |
| 3 | Volcan           | Le **Roi des slimes**                                | Fin du jeu       |

Les missions se débloquent dans l'ordre sur la carte de l'île.

## Les pouvoirs

### 🛡️ Bouclier (mission 1)

- **2 s** d'invincibilité totale, puis **4 s** de recharge.
- Sert surtout contre les **pluies de projectiles**, impossibles à esquiver entièrement.

### 💥 Ravageuse (mission 2)

- Tue **instantanément tous les ennemis à l'écran**.
- Coûte **1 vie** à chaque utilisation.
- Peut être lancée **même avec la dernière vie**, mais la magicienne y laisse sa dernière
  force : les ennemis meurent, elle aussi, et **le niveau est perdu**.
  Exception : le combat contre le Roi (voir la fin alternative).
- C'est le **seul moyen de vaincre le Roi des slimes**.

### Vies

- 3 vies au départ.
- On ne les récupère **qu'à la source de soin**, sur la carte de l'île.
  Il faut donc revenir s'y soigner avant de repartir en mission.

## Le combat contre le Roi des slimes

1. Le Roi est protégé par une **carapace de slime** : la ravageuse n'a aucun effet tant
   qu'elle est en place.
2. Il attaque, notamment avec des pluies de projectiles qui couvrent l'écran.
   Le bouclier permet d'y survivre.
3. Après une série d'attaques, il s'essouffle et **ouvre sa garde** pendant quelques secondes.
4. Une **ravageuse** à ce moment-là l'achève **en un seul coup**.

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

## La carte de l'île (à faire)

- Vue de dessus, style Pokémon, déplacement case par case dans les 4 directions.
- Carte écrite en texte, comme les niveaux (légende à définir dans `world.js`).
- Une entrée par mission. Les entrées verrouillées sont bloquées par la brume (ou un rocher).
- En fin de mission, retour sur la carte au lieu de passer directement au niveau suivant.
- Sauvegarde : missions terminées, pouvoirs obtenus, position sur la carte.
- Sur mobile : ajouter un bouton ▼ et un bouton « Entrer ».
