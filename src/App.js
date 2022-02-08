import {
  DrawingManager,
  GoogleMap,
  Marker,
  MarkerClusterer,
  useJsApiLoader,
} from "@react-google-maps/api";
import "./App.css";
import { useCallback, useState } from "react";
import { getBounds, isPointInPolygon, getPreciseDistance } from "geolib";

const containerStyle = {
  width: "auto",
  height: "600px",
};

const center = {
  lat: 24.768454429319572,
  lng: 46.64464291292219,
};

const options = {
  fillColor: "lightblue",
  fillOpacity: 1,
  strokeColor: "red",
  strokeOpacity: 1,
  strokeWeight: 2,
  clickable: true,
  draggable: true,
  editable: true,
  geodesic: false,
  zIndex: 1,
};

function App() {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "",
    libraries: ["drawing"],
  });

  const [map, setMap] = useState(null);
  const [polygon, setPolygon] = useState();
  const [markers, setMarkers] = useState();

  const [target, setTarget] = useState();
  const [maxAttempts, setMaxAttempts] = useState(1000);
  const [minDistance, setMinDistance] = useState(30);

  const onLoad = useCallback(function callback(map) {
    // const bounds = new window.google.maps.LatLngBounds();
    // map.fitBounds(bounds);
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const onPolygonComplete = (polygon) => {
    const finalArray = [];
    for (const path of polygon.getPath().getArray()) {
      finalArray.push([path.lng(), path.lat()]);
    }
    setPolygon(finalArray);
  };

  const onCalculate = () => {
    const markers = [];
    let max = maxAttempts;

    for (const marker of Array(max).keys()) {
      if (markers.length === target) {
        break;
      }
      const bounds = getBounds(polygon);

      const minX = bounds.minLat;
      const maxX = bounds.maxLat;
      const minY = bounds.minLng;
      const maxY = bounds.maxLng;

      const lat = minX + Math.random() * (maxX - minX);
      const lng = minY + Math.random() * (maxY - minY);
      const newMarker = [lng, lat];

      if (isPointInPolygon(newMarker, polygon)) {
        let isOk = true;
        // Check Distance
        for (let i = 0; i < markers.length; i++) {
          const marker = markers[i];
          const distance = getPreciseDistance(marker, newMarker, 1);
          if (distance < minDistance) {
            isOk = false;
            break;
          }
        }
        if (isOk) {
          markers.push({ lat, lng });
        }
      }
    }
    console.log(markers);
    setMarkers(markers);
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>1- Draw Polygon</h3>
      {isLoaded && (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          <>
            <DrawingManager
              onLoad={onLoad}
              onPolygonComplete={onPolygonComplete}
              options={{
                drawingMode: "polygon",
                drawingControlOptions: {
                  drawingModes: ["polygon"],
                  // position: 2.0,
                },
              }}
            />
            {markers?.map((marker) => (
              <Marker key={`${marker.lat} ${marker.lng}`} position={marker} />
            ))}
          </>
        </GoogleMap>
      )}
      <br />
      <h3>2- Calculate</h3>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        <label>
          Target Num:
          <br />
          <input
            value={target?.toString() ?? 0}
            onChange={(event) => setTarget(parseInt(event.target.value || 0))}
          />
        </label>
        <br />
        <label>
          Min Distance (m):
          <br />
          <input
            value={minDistance?.toString()}
            onChange={(event) =>
              setMinDistance(parseInt(event.target.value || 0))
            }
          />
        </label>
        <br />
        <label>
          Maximum Attempts:
          <br />
          <input
            value={maxAttempts?.toString()}
            onChange={(event) =>
              setMaxAttempts(parseInt(event.target.value || 0))
            }
          />
        </label>
        <br />
        <button
          style={{ width: 75 }}
          onClick={() => onCalculate()}
          disabled={!polygon || !maxAttempts || !target}
        >
          Calculate
        </button>
      </div>
      {markers?.length && (
        <>
          <h3>3- Result</h3>
          <p>
            <b>{markers.length} markers</b> drawn, you can try again!
          </p>
        </>
      )}
    </div>
  );
}

export default App;
