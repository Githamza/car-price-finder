import React from "react";
import { MapLegendProps } from "../types";

const MapLegend: React.FC<MapLegendProps> = ({ showSelected = true }) => {
  return (
    <div className="map-legend">
      {/* Cluster representation for when zoomed out */}
      <div className="mb-2 pb-2 border-b border-gray-200">
        <div className="text-xs font-semibold mb-1">
          Vue large (zoom faible)
        </div>
        <div className="legend-item">
          <div
            className="legend-color rounded-full"
            style={{
              background: "linear-gradient(to right, purple, red)",
              width: "16px",
              height: "16px",
            }}
          ></div>
          <div className="legend-label">Cluster de trajets</div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Taille = nombre de trajets
        </div>
        <div className="text-xs text-gray-500">
          Couleur = densité de trajets
        </div>
      </div>

      {/* Individual trips for when zoomed in */}
      <div>
        <div className="text-xs font-semibold mb-1">
          Vue détaillée (zoom élevé)
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#3388ff" }}
          ></div>
          <div className="legend-label">Point de départ</div>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: "#ff3388" }}
          ></div>
          <div className="legend-label">Point d'arrivée</div>
        </div>
        <div className="legend-item">
          <div
            className="mr-2"
            style={{
              height: "2px",
              width: "12px",
              backgroundColor: "#3388ff",
            }}
          ></div>
          <div className="legend-label">Trajet</div>
        </div>

        {showSelected && (
          <div className="mt-2">
            <div className="text-xs font-semibold mb-1">Sélection</div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "#30c0ff" }}
              ></div>
              <div className="legend-label">Départ (sélectionné)</div>
            </div>
            <div className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: "#ff30c0" }}
              ></div>
              <div className="legend-label">Arrivée (sélectionnée)</div>
            </div>
            <div className="legend-item">
              <div
                className="mr-2"
                style={{
                  height: "4px",
                  width: "12px",
                  backgroundColor: "#30c0ff",
                }}
              ></div>
              <div className="legend-label">Trajet sélectionné</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapLegend;
