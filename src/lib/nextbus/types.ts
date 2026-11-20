import type { GeoPoint } from "@/lib/geo";
import type { RouteMode, RouteSummary } from "@/lib/routes";

export type { RouteSummary };

export type Stop = {
  tag: string;
  stopId: string;
  title: string;
  lat: number;
  lon: number;
};

export type Direction = {
  tag: string;
  title: string;
  name: string;
  branch: string;
  useForUI: boolean;
  stopTags: string[];
};

export type RouteConfig = {
  tag: string;
  title: string;
  shortName: string;
  longName: string;
  mode: RouteMode;
  color: string | null;
  oppositeColor: string | null;
  latMin: number | null;
  latMax: number | null;
  lonMin: number | null;
  lonMax: number | null;
  stops: Stop[];
  directions: Direction[];
  paths: GeoPoint[][];
};

export type Prediction = {
  minutes: number;
  seconds: number;
  epochTime: number;
  vehicle: string;
  branch: string;
  tripTag: string;
  dirTag: string;
  isDeparture: boolean;
  affectedByLayover: boolean;
};

export type PredictionGroup = {
  title: string;
  predictions: Prediction[];
};

export type FeedMessage = {
  text: string;
  priority: string;
};

export type StopPrediction = {
  routeTag: string;
  routeTitle: string;
  stopTag: string;
  stopTitle: string;
  agencyTitle: string;
  messages: FeedMessage[];
  directions: PredictionGroup[];
  noPredictionsTitle: string | null;
};

export type Vehicle = {
  id: string;
  routeTag: string;
  dirTag: string;
  lat: number;
  lon: number;
  heading: number;
  speedKmHr: number;
  predictable: boolean;
  secsSinceReport: number;
};

export type VehicleFeed = {
  vehicles: Vehicle[];
  lastTime: number;
};
