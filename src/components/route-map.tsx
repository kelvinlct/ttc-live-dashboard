"use client";

import { useEffect, useMemo, useRef } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { RouteConfig, Vehicle } from "@/lib/nextbus/types";

type Point = [number, number];

function Fit({ positions }: { positions: Point[] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || positions.length === 0) return;
    fitted.current = true;
    map.fitBounds(positions, { padding: [28, 28], maxZoom: 15 });
  }, [map, positions]);
  return null;
}

function vehicleIcon(heading: number, color: string) {
  return L.divIcon({
    className: "vehicle-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<span style="display:grid;place-items:center;width:28px;height:28px;border-radius:999px;background:${color};color:white;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"><span style="display:block;transform:rotate(${heading}deg);font-size:13px;line-height:1" aria-hidden="true">▲</span></span>`,
  });
}

export default function RouteMap({
  route,
  vehicles,
}: {
  route: RouteConfig;
  vehicles: Vehicle[];
}) {
  const color = route.color ?? "#e10600";
  const positions = useMemo<Point[]>(() => {
    if (
      route.latMin != null &&
      route.latMax != null &&
      route.lonMin != null &&
      route.lonMax != null
    ) {
      return [
        [route.latMin, route.lonMin],
        [route.latMax, route.lonMax],
      ];
    }
    return route.stops.slice(0, 40).map((stop) => [stop.lat, stop.lon]);
  }, [route.latMin, route.latMax, route.lonMin, route.lonMax, route.stops]);

  const center = positions[0] ?? ([43.6532, -79.3832] as Point);

  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
      />
      <Fit positions={positions} />
      {route.paths.map((path, index) => (
        <Polyline
          key={index}
          positions={path.map((point) => [point.lat, point.lon] as Point)}
          pathOptions={{ color, weight: 3, opacity: 0.75 }}
        />
      ))}
      {route.stops.map((stop) => (
        <CircleMarker
          key={stop.tag}
          center={[stop.lat, stop.lon]}
          radius={4}
          pathOptions={{ color, weight: 1, fillColor: "#fffdf8", fillOpacity: 1 }}
        >
          <Popup>
            <strong>{stop.title}</strong>
            <br />
            Stop {stop.stopId}
            <br />
            <a href={`/routes/${route.tag}/stops/${stop.tag}`}>Arrivals</a>
          </Popup>
        </CircleMarker>
      ))}
      {vehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={[vehicle.lat, vehicle.lon]}
          icon={vehicleIcon(vehicle.heading, color)}
        >
          <Popup>
            <strong>Vehicle {vehicle.id}</strong>
            <br />
            {Math.round(vehicle.speedKmHr)} km/h · reported {vehicle.secsSinceReport}s ago
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
