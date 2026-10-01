import type { Availability, Fare, LiveStatus, NearbyStation, Station, Train, TravelClass } from "@/lib/types";

/** Every railway data source implements this. Engine/UI never import a concrete provider. */
export interface RailwayProvider {
  readonly name: string;
  readonly isDemo: boolean;
  searchStations(query: string): Promise<Station[]>;
  getStation(code: string): Promise<Station | null>;
  getNearbyStations(code: string, radiusKm: number): Promise<NearbyStation[]>;
  /** Trains calling at a station on a date. */
  searchTrains(opts: { station: string; date: string }): Promise<Train[]>;
  getTrainSchedule(number: string): Promise<Train | null>;
  /** Must return status "UNKNOWN" (source "none") when no verified source exists. Never guess. */
  getAvailability(number: string, from: string, to: string, date: string, cls: TravelClass): Promise<Availability>;
  getFare(number: string, from: string, to: string, cls: TravelClass, date: string): Promise<Fare | null>;
  /** null = no real-time source connected. */
  getLiveStatus(trainNumber: string): Promise<LiveStatus | null>;
}
