import type { RailwayProvider } from "./types";
import { MockRailwayProvider } from "./mock";

/** Server-side only. Add a RealRailwayProvider here (reads RAIL_API_KEY from env) and switch on RAIL_PROVIDER. */
export function getProvider(): RailwayProvider {
  return new MockRailwayProvider();
}
