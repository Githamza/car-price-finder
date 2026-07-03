import React, { useState, useCallback } from "react";
import { useTripData } from "./contexts/TripDataContext";
import Map from "./components/Map";
import InfoPanel from "./components/InfoPanel";
import MessageToast from "./components/MessageToast";
import { MapStats } from "./types";

function App(): React.ReactElement {
  const { message } = useTripData();
  const [mapStats, setMapStats] = useState<MapStats | null>(null);

  // Handle map stats updates from Map component
  const handleMapStatsChange = useCallback((stats: MapStats): void => {
    setMapStats(stats);
  }, []);

  return (
    <div className="App relative">
      <Map onStatsChange={handleMapStatsChange} />
      <InfoPanel mapStats={mapStats} />
      {message && <MessageToast type={message.type} text={message.text} />}
    </div>
  );
}

export default App;
