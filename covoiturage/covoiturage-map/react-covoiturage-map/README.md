# Covoiturage Map React

Application interactive permettant de visualiser les trajets de covoiturage en France, basée sur les données ouvertes du Registre de Preuve de Covoiturage.

## Fonctionnalités

- Affichage des trajets de covoiturage sur une carte interactive
- Visualisation des points de départ et d'arrivée
- Statistiques sur le nombre de trajets et la distance totale
- Traitement des données CSV depuis l'API
- Interface adaptative pour mobile et desktop
- Mode hors ligne (PWA)

## Technologies utilisées

- React 18
- React Leaflet (visualisation cartographique)
- Tailwind CSS (UI)
- Context API (gestion d'état)
- PapaParse (traitement CSV)
- Service Worker (fonctionnalités hors ligne)

## Installation

1. Cloner le repository
2. Installer les dépendances :

```bash
cd react-covoiturage-map
npm install
```

3. Lancer l'application en mode développement :

```bash
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Build pour la production

Pour générer une version optimisée pour la production :

```bash
npm run build
```

Les fichiers seront générés dans le dossier `build/`.

## Structure du projet

```
react-covoiturage-map/
├── public/               # Fichiers statiques
│   ├── index.html        # Point d'entrée HTML
│   ├── manifest.json     # Configuration PWA
│   └── service-worker.js # Service worker pour fonctionnalités offline
├── src/                  # Code source
│   ├── assets/           # Images et ressources
│   ├── components/       # Composants React
│   │   ├── Map.js        # Composant de carte Leaflet
│   │   ├── InfoPanel.js  # Panneau d'information
│   │   ├── MapLegend.js  # Légende de la carte
│   │   └── MessageToast.js # Notifications
│   ├── contexts/         # Contextes React
│   │   └── TripDataContext.js # Gestion des données de trajets CSV
│   ├── App.js            # Composant principal
│   ├── index.js          # Point d'entrée JavaScript
│   └── index.css         # Styles globaux avec Tailwind
├── package.json          # Dépendances et scripts
└── README.md             # Documentation
```

## Gestion des données CSV

L'application récupère et analyse les données CSV à partir de l'API data.gouv.fr. Le traitement des données comprend :

1. Récupération du fichier CSV depuis l'API
2. Analyse du CSV avec PapaParse
3. Mappage des colonnes CSV vers notre modèle de données
4. Gestion des différents formats potentiels de noms de colonnes
5. Filtrage des données invalides (coordonnées manquantes ou non numériques)

## Sources de données

Les données de trajets de covoiturage proviennent du Registre de Preuve de Covoiturage, disponibles sur [data.gouv.fr](https://www.data.gouv.fr/fr/datasets/trajets-realises-en-covoiturage-registre-de-preuve-de-covoiturage/).

## Licence

Ce projet est sous licence MIT.
