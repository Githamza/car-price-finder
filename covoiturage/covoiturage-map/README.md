# Carte des Covoiturages en France

Une application web qui visualise les données de covoiturage en France sur une carte interactive.

## Description

Cette application affiche les trajets de covoiturage en France à partir des données du Registre de Preuve de Covoiturage, accessible via [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/trajets-realises-en-covoiturage-registre-de-preuve-de-covoiturage/).

L'application fournit :

- Une carte interactive des trajets de covoiturage
- Des statistiques sur le nombre de trajets et la distance totale
- Des détails sur chaque trajet (date, distance, opérateur)

## Technologies utilisées

- Leaflet.js pour la cartographie
- TailwindCSS pour le style
- API de données ouvertes du gouvernement français

## Installation et démarrage

1. Clonez ce dépôt :

```
git clone [URL_DU_REPO]
```

2. Ouvrez le fichier index.html dans votre navigateur

Aucune installation supplémentaire n'est nécessaire, car les dépendances sont chargées via CDN.

## Structure du projet

```
covoiturage-map/
│
├── index.html              # Point d'entrée HTML
├── src/
│   └── app/
│       └── main.js         # Code JavaScript principal
│
└── README.md               # Documentation
```

## Fonctionnalités

- Visualisation des points de départ et d'arrivée des trajets
- Lignes représentant les trajets entre les points
- Popups d'information au clic sur un point
- Statistiques globales sur les trajets

## Source de données

Les données proviennent du Registre de Preuve de Covoiturage qui est mis à jour régulièrement. L'API utilisée est accessible à l'adresse suivante :
[https://www.data.gouv.fr/fr/datasets/r/8c8a308e-6997-4f03-b278-a0071c24d09b](https://www.data.gouv.fr/fr/datasets/r/8c8a308e-6997-4f03-b278-a0071c24d09b)

## Licence

Ce projet est sous licence MIT - voir le fichier LICENSE pour plus de détails.
