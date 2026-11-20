import { describe, expect, it } from "vitest";
import { destinationOf, formatAlertWindow, minuteLabel } from "@/lib/format";

describe("format helpers", () => {
  it("labels due vehicles and plural minutes", () => {
    expect(minuteLabel(0)).toBe("Due");
    expect(minuteLabel(1)).toBe("1 min");
    expect(minuteLabel(12)).toBe("12 min");
  });

  it("pulls the destination out of a direction title", () => {
    expect(destinationOf("West - 504 King towards Dundas West Station")).toBe(
      "Dundas West Station",
    );
    expect(destinationOf("Eastbound")).toBe("Eastbound");
  });

  it("formats an alert window in Toronto time", () => {
    const window = formatAlertWindow("2026-11-19T04:59:00.000Z", "2026-11-21T04:59:00.000Z");
    expect(window).toContain("Nov 18");
    expect(window).toContain("Nov 20");
    expect(formatAlertWindow("2026-11-19T16:00:00.000Z", null)).toMatch(/^Since /);
  });
});
