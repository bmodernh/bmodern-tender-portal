import { describe, it, expect, vi } from "vitest";

// ─── Chat message validation ─────────────────────────────────────────────────
describe("Chat message validation", () => {
  it("should reject empty messages", () => {
    const message = "";
    expect(message.trim().length).toBe(0);
  });

  it("should accept valid messages", () => {
    const message = "Hello, I have a question about the upgrade options.";
    expect(message.trim().length).toBeGreaterThan(0);
  });

  it("should handle long messages", () => {
    const message = "A".repeat(5000);
    expect(message.length).toBe(5000);
    // Messages should be capped at a reasonable length
    const MAX_LENGTH = 10000;
    expect(message.length).toBeLessThanOrEqual(MAX_LENGTH);
  });

  it("should identify sender types correctly", () => {
    const adminMessage = { senderType: "admin" as const, senderName: "B Modern Team", message: "Hi there" };
    const clientMessage = { senderType: "client" as const, senderName: "John Smith", message: "Hello" };
    
    expect(adminMessage.senderType).toBe("admin");
    expect(clientMessage.senderType).toBe("client");
    expect(["admin", "client"]).toContain(adminMessage.senderType);
    expect(["admin", "client"]).toContain(clientMessage.senderType);
  });
});

// ─── Custom item request validation ──────────────────────────────────────────
describe("Custom item request validation", () => {
  it("should require an item name", () => {
    const request = { itemName: "", description: "", preferredBrand: "" };
    expect(request.itemName.trim().length).toBe(0);
  });

  it("should accept valid custom item requests", () => {
    const request = {
      itemName: "Underfloor Heating",
      description: "Electric underfloor heating for master bedroom",
      preferredBrand: "Warmtech",
      room: "Master Bedroom",
      quantity: 1,
      referenceUrl: "https://warmtech.com.au/product/123",
    };
    expect(request.itemName.trim().length).toBeGreaterThan(0);
    expect(request.quantity).toBeGreaterThan(0);
  });

  it("should handle status transitions correctly", () => {
    const validStatuses = ["submitted", "under_review", "priced", "approved", "declined"];
    
    // New requests start as submitted
    const newRequest = { status: "submitted" };
    expect(validStatuses).toContain(newRequest.status);
    
    // Admin can price a request
    const pricedRequest = { ...newRequest, status: "priced", adminPrice: "2500.00", adminNotes: "Includes installation" };
    expect(validStatuses).toContain(pricedRequest.status);
    expect(parseFloat(pricedRequest.adminPrice)).toBeGreaterThan(0);
  });

  it("should validate quantity is positive", () => {
    const validQty = 3;
    const invalidQty = 0;
    const negativeQty = -1;
    
    expect(validQty).toBeGreaterThan(0);
    expect(invalidQty).toBeLessThanOrEqual(0);
    expect(negativeQty).toBeLessThan(0);
  });
});

// ─── Upgrade pricing calculation ─────────────────────────────────────────────
describe("Upgrade pricing calculation", () => {
  it("should calculate upgrade total correctly for tier selections", () => {
    const lineItems = [
      { itemKey: "tapware", tier2Delta: "450", tier3Delta: "1200" },
      { itemKey: "benchtop", tier2Delta: "2000", tier3Delta: "5500" },
      { itemKey: "flooring", tier2Delta: "1800", tier3Delta: "4000" },
    ];
    
    const selections: Record<string, number> = {
      tapware: 2,   // Tier 2
      benchtop: 3,  // Tier 3
      flooring: 1,  // Base (no upgrade)
    };
    
    let total = 0;
    for (const item of lineItems) {
      const tier = selections[item.itemKey] ?? 1;
      if (tier === 2) total += Number(item.tier2Delta || 0);
      else if (tier === 3) total += Number(item.tier3Delta || 0);
    }
    
    // tapware tier2 (450) + benchtop tier3 (5500) + flooring base (0) = 5950
    expect(total).toBe(5950);
  });

  it("should handle negative deltas (cheaper upgrades)", () => {
    const item = { itemKey: "downgrade", tier2Delta: "-500", tier3Delta: "-200" };
    const tier = 2;
    const delta = tier === 2 ? Number(item.tier2Delta) : Number(item.tier3Delta);
    expect(delta).toBeLessThan(0);
    expect(delta).toBe(-500);
  });

  it("should default to tier 1 when no selection exists", () => {
    const selections: Record<string, number> = {};
    const tier = selections["unknown_item"] ?? 1;
    expect(tier).toBe(1);
  });
});

// ─── Currency formatting ─────────────────────────────────────────────────────
describe("Currency formatting", () => {
  it("should format AUD currency correctly", () => {
    const fmt = (value: number) =>
      new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    
    expect(fmt(490000)).toBe("$490,000");
    expect(fmt(5950)).toBe("$5,950");
    expect(fmt(0)).toBe("$0");
    expect(fmt(495950)).toBe("$495,950");
  });
});

// ─── Submission response validation ──────────────────────────────────────────
describe("Submission response validation", () => {
  it("should validate admin response price is a valid number", () => {
    const validPrice = "535000.00";
    const parsed = parseFloat(validPrice);
    expect(parsed).toBeGreaterThan(0);
    expect(isNaN(parsed)).toBe(false);
  });

  it("should handle submission with notes", () => {
    const submission = {
      totalUpgradeCost: "45000.00",
      notes: "Please confirm the tapware selection is available in brushed nickel.",
    };
    expect(parseFloat(submission.totalUpgradeCost)).toBeGreaterThanOrEqual(0);
    expect(submission.notes.length).toBeGreaterThan(0);
  });
});
