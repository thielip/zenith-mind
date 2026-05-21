import { buildSevenDaySeries, dateKey, lastNDaysUtc } from "../click-stats";

describe("affiliate click-stats", () => {
  it("builds seven day series with zeros for missing days", () => {
    const keys = lastNDaysUtc(7).map(dateKey);
    const lastKey = keys[keys.length - 1]!;
    const map = new Map<string, number>([[lastKey, 3]]);
    expect(buildSevenDaySeries(map, keys)).toEqual([0, 0, 0, 0, 0, 0, 3]);
  });
});
