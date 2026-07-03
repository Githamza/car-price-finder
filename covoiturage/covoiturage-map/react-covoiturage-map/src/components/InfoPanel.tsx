import React from "react";
import { useTripData } from "../contexts/TripDataContext";
import MapLegend from "./MapLegend";
import { InfoPanelProps } from "../types";
import { formatNumber, formatDistance, formatDate } from "../utils/format";

const InfoPanel: React.FC<InfoPanelProps> = ({ mapStats }) => {
  const { isLoading, stats, fetchTripData, selectedTrip, clearSelectedTrip } =
    useTripData();

  const handleRefresh = (): void => {
    fetchTripData();
  };

  return (
    <div className="info-panel">
      <h1 className="text-xl font-bold mb-2">Covoiturage en France</h1>
      <p className="text-sm mb-4">
        Visualisation des trajets de covoiturage en France
      </p>

      {/* Map View Information */}
      {mapStats && (
        <div className="map-stats mb-4 p-2 border border-gray-300 bg-gray-50 rounded-md">
          <h3 className="text-sm font-semibold mb-1">Vue actuelle</h3>
          <div className="text-xs">
            <p>Zoom: {mapStats.zoom?.toFixed(1) || "N/A"}</p>
            {mapStats.zoom < 10 && (
              <p>Zones affichées: {formatNumber(mapStats.clusterCount)}</p>
            )}
            {mapStats.zoom >= 10 && (
              <p>Trajets affichés: {formatNumber(mapStats.tripCount)}</p>
            )}
            <p className="text-gray-500 mt-1">
              {mapStats.zoom < 10
                ? "Zoom in pour voir les trajets individuels"
                : `Affichage limité à ${formatNumber(
                    mapStats.tripCount
                  )} trajets pour des performances optimales`}
            </p>
          </div>
        </div>
      )}

      {/* Selected Trip Information */}
      {selectedTrip && (
        <div className="selected-trip mb-4 p-3 border border-blue-300 bg-blue-50 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-blue-700">
              Trajet sélectionné
            </h3>
            <button
              onClick={() => clearSelectedTrip()}
              className="text-xs text-gray-500 hover:text-gray-700"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          <div className="text-xs">
            <p>
              <strong>Date:</strong> {formatDate(selectedTrip.datetime)}
            </p>
            <p>
              <strong>Distance:</strong>{" "}
              {formatDistance(selectedTrip.journey_distance)}
            </p>
            {selectedTrip.operator_class && (
              <p>
                <strong>Classe d'opérateur:</strong>{" "}
                {selectedTrip.operator_class}
              </p>
            )}
            {selectedTrip.passenger_seats > 0 && (
              <p>
                <strong>Passagers:</strong> {selectedTrip.passenger_seats}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats Information */}
      <div className="stats-section mb-4 p-3 border border-green-200 bg-green-50 rounded-md">
        <h3 className="text-sm font-semibold text-green-700 mb-2">
          Statistiques générales
        </h3>
        <div className="text-xs">
          <p>
            <strong>Nombre total de trajets:</strong>{" "}
            {formatNumber(stats.totalTrips)}
          </p>
          <p>
            <strong>Distance totale parcourue:</strong>{" "}
            {formatDistance(stats.totalDistance)}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="legend-section mb-4">
        <h3 className="text-sm font-semibold mb-2">Légende</h3>
        <MapLegend />
      </div>

      {/* Footer with refresh button */}
      <div className="footer flex justify-center mt-4">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="refresh-button px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded disabled:opacity-50"
        >
          {isLoading ? "Chargement..." : "Rafraîchir les données"}
        </button>
      </div>
    </div>
  );
};

export default InfoPanel;
