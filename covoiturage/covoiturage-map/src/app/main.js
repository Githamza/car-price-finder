// Configuration initiale de la carte avec Leaflet
const map = L.map("map").setView([46.603354, 1.888334], 6); // Centre sur la France
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Constantes et variables globales
const API_URL =
  "https://www.data.gouv.fr/fr/datasets/r/8c8a308e-6997-4f03-b278-a0071c24d09b";
let tripData = [];
let markers = L.layerGroup().addTo(map);

let isLoading = false;

// Éléments DOM pour les statistiques
const tripCountElement = document.getElementById("trip-count");
const totalDistanceElement = document.getElementById("total-distance");
const refreshButton = document.getElementById("refresh-btn");

// Événements
refreshButton.addEventListener("click", () => {
  if (!isLoading) {
    fetchTripData();
  }
});

// Fonction pour charger les données depuis l'API
async function fetchTripData() {
  if (isLoading) return;

  isLoading = true;
  setLoadingState(true);

  try {
    console.log("Chargement des données depuis l'API...");
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Données chargées: ${data.length} trajets`);

    // Vérifier si les données sont dans le bon format
    if (Array.isArray(data) && data.length > 0) {
      tripData = data;

      // Filtrer les trajets invalides (sans coordonnées)
      tripData = tripData.filter(
        (trip) =>
          trip.journey_start_lat &&
          trip.journey_start_lon &&
          !isNaN(trip.journey_start_lat) &&
          !isNaN(trip.journey_start_lon)
      );

      // Mise à jour des statistiques et de la carte
      updateStats();
      displayTrips();

      // Mettre à jour l'interface pour indiquer le succès
      showMessage("success", `${tripData.length} trajets chargés avec succès`);
    } else {
      throw new Error("Format de données invalide");
    }
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    showMessage("error", `Erreur: ${error.message}`);

    // En cas d'erreur, on utilise des exemples de données pour tests
    useSampleData();
  } finally {
    isLoading = false;
    setLoadingState(false);
  }
}

// Fonction pour afficher un message temporaire
function showMessage(type, text, duration = 3000) {
  // Créer un élément de message
  const messageElement = document.createElement("div");
  messageElement.className = `message message-${type} fixed bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-md text-white text-sm z-50`;
  messageElement.style.backgroundColor =
    type === "success" ? "#10b981" : "#ef4444";
  messageElement.textContent = text;

  document.body.appendChild(messageElement);

  // Supprimer le message après la durée spécifiée
  setTimeout(() => {
    messageElement.style.opacity = "0";
    messageElement.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 500);
  }, duration);
}

// Fonction pour mettre l'interface en mode chargement
function setLoadingState(isLoading) {
  if (isLoading) {
    refreshButton.textContent = "Chargement...";
    refreshButton.disabled = true;
    refreshButton.classList.add("opacity-70", "cursor-not-allowed");
    tripCountElement.classList.add("loading");
    totalDistanceElement.classList.add("loading");
  } else {
    refreshButton.textContent = "Rafraîchir les données";
    refreshButton.disabled = false;
    refreshButton.classList.remove("opacity-70", "cursor-not-allowed");
    tripCountElement.classList.remove("loading");
    tripCountElement.classList.remove("loading");
  }
}

// Fonction pour utiliser des données d'exemple en cas d'erreur de l'API
function useSampleData() {
  tripData = [
    {
      journey_id: "sample1",
      datetime: "2023-05-15T08:30:00Z",
      journey_start_lat: 48.8566,
      journey_start_lon: 2.3522,
      journey_end_lat: 45.764,
      journey_end_lon: 4.8357,
      journey_distance: 450000, // 450 km en mètres
      operator: "BlaBlacar",
      passenger_count: 3,
    },
    {
      journey_id: "sample2",
      datetime: "2023-05-15T09:15:00Z",
      journey_start_lat: 43.2965,
      journey_start_lon: 5.3698,
      journey_end_lat: 43.6043,
      journey_end_lon: 1.4437,
      journey_distance: 320000, // 320 km en mètres
      operator: "Karos",
      passenger_count: 2,
    },
    {
      journey_id: "sample3",
      datetime: "2023-05-15T10:00:00Z",
      journey_start_lat: 47.2184,
      journey_start_lon: -1.5536,
      journey_end_lat: 44.8378,
      journey_end_lon: -0.5792,
      journey_distance: 280000, // 280 km en mètres
      operator: "Klaxit",
      passenger_count: 4,
    },
  ];

  updateStats();
  displayTrips();
  showMessage("warning", "Utilisation de données d'exemple", 5000);
}

// Fonction pour mettre à jour les statistiques
function updateStats() {
  if (!tripData || tripData.length === 0) {
    tripCountElement.textContent = "0";
    totalDistanceElement.textContent = "0 km";
    return;
  }

  const totalTrips = tripData.length;
  let totalDistance = 0;

  tripData.forEach((trip) => {
    totalDistance += trip.journey_distance || 0;
  });

  // Conversion des mètres en kilomètres et formatage
  const formattedDistance = (totalDistance / 1000).toLocaleString("fr-FR", {
    maximumFractionDigits: 0,
  });

  tripCountElement.textContent = totalTrips.toLocaleString("fr-FR");
  totalDistanceElement.textContent = `${formattedDistance} km`;
}

// Fonction pour afficher les trajets sur la carte
function displayTrips() {
  // Nettoyer les marqueurs précédents
  markers.clearLayers();

  // Limiter le nombre de trajets affichés pour les performances
  const maxTripsToDisplay = 1000;
  const tripsToDisplay = tripData.slice(0, maxTripsToDisplay);

  if (tripsToDisplay.length === 0) {
    showMessage("warning", "Aucun trajet à afficher", 3000);
    return;
  }

  // Collecter les emplacements pour créer une vue englobante
  const bounds = [];

  tripsToDisplay.forEach((trip) => {
    // Vérifier que les coordonnées sont valides
    if (!trip.journey_start_lat || !trip.journey_start_lon) return;

    // Ajouter le point aux limites
    bounds.push([trip.journey_start_lat, trip.journey_start_lon]);

    // Créer un marqueur pour le point de départ
    const startMarker = L.circleMarker(
      [trip.journey_start_lat, trip.journey_start_lon],
      {
        radius: 5,
        fillColor: "#3388ff",
        color: "#fff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8,
      }
    ).bindPopup(createPopupContent(trip));

    markers.addLayer(startMarker);

    // Si on a des coordonnées d'arrivée, on ajoute une ligne et un marqueur d'arrivée
    if (trip.journey_end_lat && trip.journey_end_lon) {
      bounds.push([trip.journey_end_lat, trip.journey_end_lon]);

      const tripLine = L.polyline(
        [
          [trip.journey_start_lat, trip.journey_start_lon],
          [trip.journey_end_lat, trip.journey_end_lon],
        ],
        {
          color: "#3388ff",
          weight: 2,
          opacity: 0.5,
        }
      );
      markers.addLayer(tripLine);

      // Ajouter aussi un marqueur pour la destination
      const endMarker = L.circleMarker(
        [trip.journey_end_lat, trip.journey_end_lon],
        {
          radius: 3,
          fillColor: "#ff3388",
          color: "#fff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8,
        }
      ).bindPopup(createPopupContent(trip, true));

      markers.addLayer(endMarker);
    }
  });

  // Ajuster la vue de la carte pour afficher tous les marqueurs
  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }

  // Afficher un message si le nombre de trajets a été limité
  if (tripData.length > maxTripsToDisplay) {
    showMessage(
      "info",
      `Affichage limité à ${maxTripsToDisplay} trajets sur ${tripData.length}`,
      5000
    );
  }
}

// Fonction pour créer le contenu d'un popup
function createPopupContent(trip, isEndPoint = false) {
  const pointType = isEndPoint ? "d'arrivée" : "de départ";

  return `
    <div class="popup-content">
      <h3>Trajet #${trip.journey_id || "N/A"}</h3>
      <p><strong>Point ${pointType}</strong></p>
      <p>Date: ${formatDate(trip.datetime)}</p>
      <p>Distance: ${((trip.journey_distance || 0) / 1000).toFixed(1)} km</p>
      <p>Opérateur: ${trip.operator || "Non spécifié"}</p>
      <p>Passagers: ${trip.passenger_count || 1}</p>
    </div>
  `;
}

// Fonction utilitaire pour formater les dates
function formatDate(dateString) {
  if (!dateString) return "Date inconnue";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "Date invalide";
  }
}

// Initialisation: charger les données au chargement de la page
document.addEventListener("DOMContentLoaded", fetchTripData);
