export type AvailabilityStatus = "AVAILABLE" | "RAC" | "WAITLIST" | "NOT_AVAILABLE" | "UNKNOWN";
export type TravelClass = "SL" | "3A" | "2A" | "CC" | "2S";
export type Preference = "best" | "fastest" | "cheapest" | "fewest_changes" | "availability" | "least_walking" | "comfortable";
export type Flexibility = "strict" | "balanced" | "flexible";
export type DataSource = "demo" | "live";

export interface Station { code: string; name: string; city: string; major?: boolean; complex?: boolean }
export interface TrainStop { station: string; arr: number; dep: number } // minutes since midnight of departure day
export interface Train { number: string; name: string; type: "Superfast" | "Express" | "Intercity" | "Local"; stops: TrainStop[]; classes: Partial<Record<TravelClass, AvailabilityStatus>> }
export interface Availability { status: AvailabilityStatus; source: DataSource | "none"; checkedAt?: string }
export interface Fare { amount: number; currency: "INR"; source: DataSource }
export interface NearbyStation { station: Station; distanceKm: number; roadMinutes: number; note?: string }
export interface LiveStatus { trainNumber: string; trainName: string; currentStation: string; nextStation: string; expectedArrival: string; delayMin: number; updatedAt: string; source: "live" }

export interface JourneySegment {
  trainNumber: string; trainName: string; trainType: Train["type"]; from: Station; to: Station; dep: number; arr: number;
  travelClass: TravelClass | null; classes: Partial<Record<TravelClass, Availability>>; availability: Availability; fare: Fare | null;
}
export interface Transfer { station: Station; minutes: number; requiredMinutes: number }
export interface ScorePart { factor: string; value: number; weight: number; contribution: number }
export interface RouteExplanation { summary: string; points: string[] }
export interface Journey {
  id: string; segments: JourneySegment[]; transfers: Transfer[]; depart: number; arrive: number; durationMin: number; waitMin: number;
  changes: number; status: AvailabilityStatus; fareTotal: number | null; originNearby: NearbyStation | null; destNearby: NearbyStation | null;
  extraRoadMin: number; score: number; scoreParts: ScorePart[]; tags: string[]; explanation: RouteExplanation; dataSource: DataSource;
}
export interface RouteSearch { from: string; to: string; date: string; departAfter: string; passengers: number; travelClass: TravelClass | "ANY"; preference: Preference; flexibility: Flexibility; minTransferMin: number }
export interface SearchOutcome {
  search: RouteSearch; journeys: Journey[]; examined: number; droppedTight: number; directSuitable: boolean;
  nearbyOrigin: NearbyStation[]; nearbyDest: NearbyStation[]; provider: { name: string; isDemo: boolean }; headline: string;
}
export interface UserPreference { preference: Preference; flexibility: Flexibility; travelClass: TravelClass | "ANY" }
