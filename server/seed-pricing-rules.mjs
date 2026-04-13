/**
 * Seed default upgrade pricing rules.
 * Run: node server/seed-pricing-rules.mjs
 *
 * Each rule defines:
 *   - itemKey: unique slug used throughout the system
 *   - label: display name
 *   - category: grouping for display
 *   - unit: how the quantity is measured (each / lm / m2 / fixed)
 *   - tier1Label: what's included in Built for Excellence
 *   - tier2Label / tier2CostPerUnit: Tailored Living upgrade (extra cost vs tier 1)
 *   - tier3Label / tier3CostPerUnit: Signature Series upgrade (extra cost vs tier 1)
 *
 * tier2CostPerUnit and tier3CostPerUnit are the EXTRA cost per unit above tier 1.
 * The pricing engine multiplies these by the project quantity to get the upgrade delta.
 * For "fixed" unit items, costPerUnit is the total fixed extra cost (quantity is ignored).
 */

import mysql from 'mysql2/promise';

const rules = [
  // ─── Electrical ───────────────────────────────────────────────────────────
  {
    itemKey: 'downlights',
    label: 'Downlights',
    category: 'Electrical',
    unit: 'each',
    tier1Label: '25 LED downlights (standard white trim)',
    tier2Label: '40 LED downlights (brushed nickel trim)',
    tier2CostPerUnit: 100,
    tier2Description: 'Additional 15 downlights with premium brushed nickel trim rings.',
    tier3Label: '50 LED downlights + smart scene control',
    tier3CostPerUnit: 180,
    tier3Description: '50 premium downlights with Loxone smart scene control — dim, colour-tune, and automate by room.',
    position: 1,
  },
  {
    itemKey: 'power_points',
    label: 'Double Power Points',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Standard white double GPOs',
    tier2Label: 'Brushed nickel double GPOs',
    tier2CostPerUnit: 35,
    tier2Description: 'Premium brushed nickel finish general power outlets throughout.',
    tier3Label: 'Brushed nickel GPOs + USB-C charging ports',
    tier3CostPerUnit: 75,
    tier3Description: 'Brushed nickel GPOs with integrated USB-A and USB-C charging ports.',
    position: 2,
  },
  {
    itemKey: 'switch_plates',
    label: 'Switch Plates',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Standard white switch plates',
    tier2Label: 'Brushed nickel switch plates',
    tier2CostPerUnit: 45,
    tier2Description: 'Premium brushed nickel switch plates to match GPOs.',
    tier3Label: 'Loxone smart touch switch plates',
    tier3CostPerUnit: 220,
    tier3Description: 'Loxone capacitive touch smart switch plates — scene control, dimming, and automation.',
    position: 3,
  },
  {
    itemKey: 'data_points',
    label: 'Data Points',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Standard Cat6 data points',
    tier2Label: 'Cat6A data points (brushed nickel)',
    tier2CostPerUnit: 55,
    tier2Description: 'Cat6A future-ready data points with premium brushed nickel faceplates.',
    tier3Label: 'Cat6A + structured cabling cabinet',
    tier3CostPerUnit: 120,
    tier3Description: 'Cat6A data points plus a fully patched structured cabling cabinet for whole-home networking.',
    position: 4,
  },
  {
    itemKey: 'pendant_points',
    label: 'Pendant Points',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Standard pendant points',
    tier2Label: 'Pendant points with dimmer',
    tier2CostPerUnit: 85,
    tier2Description: 'Pendant points with integrated dimmer switches.',
    tier3Label: 'Smart pendant points (Loxone dimmable)',
    tier3CostPerUnit: 195,
    tier3Description: 'Smart dimmable pendant points controlled via Loxone app and automation.',
    position: 5,
  },
  {
    itemKey: 'exhaust_fans',
    label: 'Exhaust Fans',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Standard exhaust fans',
    tier2Label: 'Silent exhaust fans with LED light',
    tier2CostPerUnit: 120,
    tier2Description: 'Ultra-quiet exhaust fans with integrated LED downlight.',
    tier3Label: 'Smart exhaust fans (humidity sensor + LED)',
    tier3CostPerUnit: 280,
    tier3Description: 'Smart exhaust fans with humidity sensor auto-activation and integrated LED.',
    position: 6,
  },

  // ─── Tapware & Sanitaryware ────────────────────────────────────────────────
  {
    itemKey: 'basin_mixers',
    label: 'Basin Mixers',
    category: 'Bathrooms',
    unit: 'each',
    tier1Label: 'Caroma Liano II basin mixer (chrome)',
    tier2Label: 'ABI Interiors basin mixer (brushed nickel)',
    tier2CostPerUnit: 350,
    tier2Description: 'ABI Interiors premium basin mixer in brushed nickel — designer profile with ceramic disc cartridge.',
    tier3Label: 'ABI Interiors basin mixer (matte black)',
    tier3CostPerUnit: 550,
    tier3Description: 'ABI Interiors signature matte black basin mixer — bold statement finish with 5-year warranty.',
    position: 7,
  },
  {
    itemKey: 'shower_sets',
    label: 'Shower Sets',
    category: 'Bathrooms',
    unit: 'each',
    tier1Label: 'Caroma Liano II shower set (chrome)',
    tier2Label: 'ABI Interiors shower set (brushed nickel)',
    tier2CostPerUnit: 650,
    tier2Description: 'ABI Interiors shower set with 200mm overhead rose and hand shower in brushed nickel.',
    tier3Label: 'ABI Interiors shower set + 300mm overhead (matte black)',
    tier3CostPerUnit: 1200,
    tier3Description: 'ABI Interiors premium 300mm overhead shower with hand shower and rail in matte black.',
    position: 8,
  },
  {
    itemKey: 'baths',
    label: 'Baths',
    category: 'Bathrooms',
    unit: 'each',
    tier1Label: 'Caroma freestanding bath (white)',
    tier2Label: 'ABI Interiors freestanding bath (matte white)',
    tier2CostPerUnit: 1200,
    tier2Description: 'ABI Interiors designer freestanding bath in matte white — smooth organic form.',
    tier3Label: 'ABI Interiors stone resin freestanding bath',
    tier3CostPerUnit: 3500,
    tier3Description: 'ABI Interiors stone resin freestanding bath — ultra-premium weight and warmth retention.',
    position: 9,
  },
  {
    itemKey: 'toilets',
    label: 'Toilets',
    category: 'Bathrooms',
    unit: 'each',
    tier1Label: 'Caroma Liano II wall-faced toilet suite',
    tier2Label: 'Caroma Urbane II wall-hung toilet',
    tier2CostPerUnit: 800,
    tier2Description: 'Caroma Urbane II wall-hung toilet with in-wall cistern — clean floating look.',
    tier3Label: 'Caroma Urbane II wall-hung + bidet seat',
    tier3CostPerUnit: 1800,
    tier3Description: 'Caroma Urbane II wall-hung toilet with integrated bidet seat and heated seat function.',
    position: 10,
  },

  // ─── Kitchen ──────────────────────────────────────────────────────────────
  {
    itemKey: 'appliances',
    label: 'Kitchen Appliances',
    category: 'Kitchen',
    unit: 'fixed',
    tier1Label: 'Westinghouse 900mm oven, cooktop, rangehood, dishwasher',
    tier2Label: 'SMEG 900mm oven, induction cooktop, rangehood, dishwasher',
    tier2CostPerUnit: 4500,
    tier2Description: 'SMEG retro-style 900mm oven, 5-zone induction cooktop, integrated rangehood, and dishwasher.',
    tier3Label: 'Fisher & Paykel 900mm oven, induction cooktop, integrated rangehood, dishwasher drawers',
    tier3CostPerUnit: 9500,
    tier3Description: 'Fisher & Paykel premium integrated appliance suite — 900mm oven, induction, integrated rangehood, and double DishDrawer dishwashers.',
    position: 11,
  },
  {
    itemKey: 'kitchen_benchtop',
    label: 'Kitchen Benchtop',
    category: 'Kitchen',
    unit: 'm2',
    tier1Label: '20mm Caesarstone (standard range)',
    tier2Label: '20mm Caesarstone (premium range)',
    tier2CostPerUnit: 180,
    tier2Description: 'Caesarstone premium range — expanded colour palette with veined and textured options.',
    tier3Label: '30mm Calacatta marble or Dekton ultra-compact',
    tier3CostPerUnit: 450,
    tier3Description: '30mm Calacatta marble or Dekton ultra-compact surface — maximum luxury and durability.',
    position: 12,
  },
  {
    itemKey: 'kitchen_cabinetry',
    label: 'Kitchen Cabinetry',
    category: 'Kitchen',
    unit: 'lm',
    tier1Label: 'Polyurethane cabinetry (standard colours)',
    tier2Label: 'Polyurethane cabinetry (premium colours + soft-close)',
    tier2CostPerUnit: 350,
    tier2Description: 'Premium polyurethane finish in expanded colour range with full soft-close hardware.',
    tier3Label: 'Two-pac painted cabinetry (custom colour)',
    tier3CostPerUnit: 750,
    tier3Description: 'Two-pac painted cabinetry in any custom colour — superior durability and finish depth.',
    position: 13,
  },
  {
    itemKey: 'splashback',
    label: 'Splashback',
    category: 'Kitchen',
    unit: 'm2',
    tier1Label: 'Subway tile splashback',
    tier2Label: 'Large format tile splashback',
    tier2CostPerUnit: 120,
    tier2Description: 'Large format (600×1200) tile splashback — fewer grout lines, more contemporary look.',
    tier3Label: 'Stone or glass splashback',
    tier3CostPerUnit: 380,
    tier3Description: 'Matching stone benchtop splashback or frameless glass panel — seamless premium finish.',
    position: 14,
  },

  // ─── Flooring ─────────────────────────────────────────────────────────────
  {
    itemKey: 'timber_hybrid_flooring',
    label: 'Timber / Hybrid Flooring',
    category: 'Flooring',
    unit: 'm2',
    tier1Label: 'Hybrid plank flooring (standard range, 1200mm plank)',
    tier2Label: 'Hybrid plank flooring (premium range, 1800mm plank)',
    tier2CostPerUnit: 25,
    tier2Description: 'Premium hybrid plank in extended 1800mm length — wider, longer planks for a more luxurious feel.',
    tier3Label: 'Engineered timber flooring (European oak)',
    tier3CostPerUnit: 85,
    tier3Description: 'Engineered European oak flooring — authentic timber warmth with structural stability.',
    position: 15,
  },
  {
    itemKey: 'carpet',
    label: 'Carpet',
    category: 'Flooring',
    unit: 'm2',
    tier1Label: 'Solution-dyed nylon carpet (standard range)',
    tier2Label: 'Wool-blend carpet (premium range)',
    tier2CostPerUnit: 35,
    tier2Description: 'Wool-blend carpet in premium range — softer underfoot with natural fibre warmth.',
    tier3Label: 'Pure wool carpet (luxury range)',
    tier3CostPerUnit: 90,
    tier3Description: 'Pure wool carpet from luxury range — the ultimate in softness, durability, and natural insulation.',
    position: 16,
  },

  // ─── Stone / Benchtops ────────────────────────────────────────────────────
  {
    itemKey: 'vanity_stone',
    label: 'Vanity Stone Tops',
    category: 'Stone',
    unit: 'each',
    tier1Label: '20mm Caesarstone vanity top (standard)',
    tier2Label: '20mm Caesarstone vanity top (premium range)',
    tier2CostPerUnit: 280,
    tier2Description: 'Premium Caesarstone vanity top with undermount basin cutout in expanded colour range.',
    tier3Label: '30mm Calacatta marble vanity top',
    tier3CostPerUnit: 750,
    tier3Description: '30mm Calacatta marble vanity top — natural stone veining unique to each slab.',
    position: 17,
  },

  // ─── Joinery ─────────────────────────────────────────────────────────────
  {
    itemKey: 'wardrobe_joinery',
    label: 'Wardrobe Joinery',
    category: 'Joinery',
    unit: 'lm',
    tier1Label: 'Melamine wardrobe with hanging and shelving',
    tier2Label: 'Polyurethane wardrobe with drawers and soft-close',
    tier2CostPerUnit: 420,
    tier2Description: 'Polyurethane finish wardrobe with integrated drawers, soft-close, and premium handles.',
    tier3Label: 'Custom walk-in robe with island and two-pac finish',
    tier3CostPerUnit: 950,
    tier3Description: 'Two-pac painted walk-in robe with island unit, LED strip lighting, and full custom layout.',
    position: 18,
  },
  {
    itemKey: 'laundry_joinery',
    label: 'Laundry Joinery',
    category: 'Joinery',
    unit: 'fixed',
    tier1Label: 'Standard melamine laundry cabinet',
    tier2Label: 'Polyurethane laundry cabinet with stone top',
    tier2CostPerUnit: 1800,
    tier2Description: 'Polyurethane laundry cabinetry with Caesarstone top and undermount sink.',
    tier3Label: 'Custom two-pac laundry with stone top and integrated hamper',
    tier3CostPerUnit: 4200,
    tier3Description: 'Two-pac painted laundry with stone benchtop, integrated hamper, and premium tapware.',
    position: 19,
  },

  // ─── Doors & Hardware ─────────────────────────────────────────────────────
  {
    itemKey: 'internal_doors',
    label: 'Internal Doors',
    category: 'Doors & Hardware',
    unit: 'each',
    tier1Label: 'Hollow core flush door (standard)',
    tier2Label: 'Solid core flush door (painted)',
    tier2CostPerUnit: 280,
    tier2Description: 'Solid core flush door — superior acoustic performance and premium feel.',
    tier3Label: 'Solid core flush door with integrated rebate (floor-to-ceiling)',
    tier3CostPerUnit: 650,
    tier3Description: 'Floor-to-ceiling solid core door with integrated rebate — architectural statement piece.',
    position: 20,
  },
  {
    itemKey: 'door_handles',
    label: 'Door Handles',
    category: 'Doors & Hardware',
    unit: 'each',
    tier1Label: 'Chrome lever handles (standard)',
    tier2Label: 'Brushed nickel lever handles',
    tier2CostPerUnit: 85,
    tier2Description: 'Premium brushed nickel lever handles throughout — consistent with tapware finish.',
    tier3Label: 'Matte black architectural lever handles',
    tier3CostPerUnit: 175,
    tier3Description: 'Matte black architectural lever handles — bold, consistent with Signature Series fixtures.',
    position: 21,
  },

  // ─── Facade ───────────────────────────────────────────────────────────────
  {
    itemKey: 'facade_cladding',
    label: 'Facade Cladding',
    category: 'Facade',
    unit: 'fixed',
    tier1Label: 'Rendered facade with feature panel',
    tier2Label: 'Rendered facade + Scyon Axon cladding feature',
    tier2CostPerUnit: 6500,
    tier2Description: 'Rendered base with Scyon Axon vertical cladding feature — contemporary textural contrast.',
    tier3Label: 'Rendered facade + natural stone or Alucobond feature',
    tier3CostPerUnit: 18000,
    tier3Description: 'Rendered facade with natural stone or Alucobond composite panel feature — premium architectural finish.',
    position: 22,
  },

  // ─── Insulation ───────────────────────────────────────────────────────────
  {
    itemKey: 'insulation',
    label: 'Insulation',
    category: 'Insulation',
    unit: 'fixed',
    tier1Label: 'R2.5 ceiling batts + R1.5 wall batts',
    tier2Label: 'R4.0 ceiling batts + R2.5 wall batts',
    tier2CostPerUnit: 2800,
    tier2Description: 'Upgraded R4.0 ceiling and R2.5 wall insulation — significantly improved thermal performance.',
    tier3Label: 'R6.0 ceiling + R2.5 wall + underfloor insulation',
    tier3CostPerUnit: 6500,
    tier3Description: 'Maximum insulation package — R6.0 ceiling, R2.5 wall, and underfloor insulation for near-passive performance.',
    position: 23,
  },

  // ─── Air Conditioning ─────────────────────────────────────────────────────
  {
    itemKey: 'air_conditioning',
    label: 'Air Conditioning',
    category: 'Air Conditioning',
    unit: 'fixed',
    tier1Label: 'Ducted reverse-cycle system (standard zones)',
    tier2Label: 'Ducted reverse-cycle system (premium zones + e-zone)',
    tier2CostPerUnit: 4500,
    tier2Description: 'Premium ducted system with e-zone individual room control and higher-capacity unit.',
    tier3Label: 'Ducted system + Loxone smart climate control',
    tier3CostPerUnit: 12000,
    tier3Description: 'Premium ducted system fully integrated with Loxone smart home — automated scheduling, presence detection, and remote control.',
    position: 24,
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let inserted = 0;
  let skipped = 0;

  for (const rule of rules) {
    const [existing] = await conn.execute(
      'SELECT id FROM upgrade_pricing_rules WHERE itemKey = ?',
      [rule.itemKey]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    await conn.execute(
      `INSERT INTO upgrade_pricing_rules
        (itemKey, label, category, unit, tier1Label, tier1ImageUrl,
         tier2Label, tier2CostPerUnit, tier2ImageUrl, tier2Description,
         tier3Label, tier3CostPerUnit, tier3ImageUrl, tier3Description, position)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        rule.itemKey, rule.label, rule.category, rule.unit,
        rule.tier1Label, rule.tier1ImageUrl ?? null,
        rule.tier2Label, rule.tier2CostPerUnit, rule.tier2ImageUrl ?? null, rule.tier2Description,
        rule.tier3Label, rule.tier3CostPerUnit, rule.tier3ImageUrl ?? null, rule.tier3Description,
        rule.position,
      ]
    );
    inserted++;
  }

  console.log(`Done: ${inserted} rules inserted, ${skipped} already existed.`);
  await conn.end();
}

main().catch(console.error);
