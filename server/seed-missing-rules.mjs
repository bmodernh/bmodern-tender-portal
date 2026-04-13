/**
 * Add all missing pricing rules and update existing ones to match the 3 tier PDFs.
 * Run: node server/seed-missing-rules.mjs
 */

import mysql from 'mysql2/promise';

// ─── NEW rules to INSERT ────────────────────────────────────────────────────
const newRules = [
  // ─── PC Items (missing sanitaryware) ──────────────────────────────────────
  {
    itemKey: 'basins',
    label: 'Basins',
    category: 'Bathrooms',
    unit: 'each',
    tier1Label: 'Caroma Liano',
    tier2Label: 'ABI Interiors Lola',
    tier2CostPerUnit: 400,
    tier2Description: 'ABI Interiors Lola basin — premium designer profile with clean geometric lines.',
    tier3Label: 'ABI Interiors Lola',
    tier3CostPerUnit: 400,
    tier3Description: 'ABI Interiors Lola basin — premium designer profile with clean geometric lines.',
    position: 25,
  },
  {
    itemKey: 'kitchen_sink',
    label: 'Kitchen Sink',
    category: 'Kitchen',
    unit: 'each',
    tier1Label: 'Caroma Compass',
    tier2Label: 'ABI Interiors Vienna Double',
    tier2CostPerUnit: 600,
    tier2Description: 'ABI Interiors Vienna Double bowl kitchen sink — premium stainless steel with sound dampening.',
    tier3Label: 'ABI Interiors Vienna Double',
    tier3CostPerUnit: 600,
    tier3Description: 'ABI Interiors Vienna Double bowl kitchen sink — premium stainless steel with sound dampening.',
    position: 26,
  },
  {
    itemKey: 'kitchen_laundry_mixer',
    label: 'Kitchen/Laundry Mixer',
    category: 'Kitchen',
    unit: 'each',
    tier1Label: 'Caroma Liano',
    tier2Label: 'ABI Interiors Elysian',
    tier2CostPerUnit: 450,
    tier2Description: 'ABI Interiors Elysian mixer tap — premium pull-out spray with ceramic disc cartridge.',
    tier3Label: 'ABI Interiors Elysian',
    tier3CostPerUnit: 450,
    tier3Description: 'ABI Interiors Elysian mixer tap — premium pull-out spray with ceramic disc cartridge.',
    position: 27,
  },
  {
    itemKey: 'laundry_sink',
    label: 'Laundry Sink',
    category: 'Laundry',
    unit: 'each',
    tier1Label: 'Caroma Laundry Tub',
    tier2Label: 'ABI Interiors Vienna Single',
    tier2CostPerUnit: 350,
    tier2Description: 'ABI Interiors Vienna Single laundry sink — premium stainless steel undermount.',
    tier3Label: 'ABI Interiors Vienna Single',
    tier3CostPerUnit: 350,
    tier3Description: 'ABI Interiors Vienna Single laundry sink — premium stainless steel undermount.',
    position: 28,
  },

  // ─── Tiles Full Height ────────────────────────────────────────────────────
  {
    itemKey: 'bathroom_floor_tiles',
    label: 'Bathroom Floor Tiles',
    category: 'Tiles',
    unit: 'm2',
    tier1Label: '$40/m² Allowance',
    tier2Label: '$50/m² Allowance',
    tier2CostPerUnit: 10,
    tier2Description: 'Upgraded tile allowance from $40 to $50 per square metre — access to premium tile ranges.',
    tier3Label: '$60/m² Allowance',
    tier3CostPerUnit: 20,
    tier3Description: 'Premium tile allowance of $60 per square metre — access to designer and imported tile ranges.',
    position: 29,
  },
  {
    itemKey: 'bathroom_wall_tiles',
    label: 'Bathroom Wall Tiles',
    category: 'Tiles',
    unit: 'm2',
    tier1Label: '$40/m² Allowance (Full Height)',
    tier2Label: '$50/m² Allowance (Full Height)',
    tier2CostPerUnit: 10,
    tier2Description: 'Upgraded wall tile allowance from $40 to $50 per square metre — full height to ceiling.',
    tier3Label: '$60/m² Allowance (Full Height)',
    tier3CostPerUnit: 20,
    tier3Description: 'Premium wall tile allowance of $60 per square metre — full height to ceiling with designer ranges.',
    position: 30,
  },
  {
    itemKey: 'laundry_floor_tiles',
    label: 'Laundry Floor Tiles',
    category: 'Tiles',
    unit: 'm2',
    tier1Label: '$40/m² Allowance',
    tier2Label: '$50/m² Allowance',
    tier2CostPerUnit: 10,
    tier2Description: 'Upgraded laundry floor tile allowance from $40 to $50 per square metre.',
    tier3Label: '$60/m² Allowance',
    tier3CostPerUnit: 20,
    tier3Description: 'Premium laundry floor tile allowance of $60 per square metre.',
    position: 31,
  },
  {
    itemKey: 'main_floor_tiles',
    label: 'Main Floor Tiles',
    category: 'Tiles',
    unit: 'm2',
    tier1Label: '$40/m² Allowance',
    tier2Label: '$50/m² Allowance',
    tier2CostPerUnit: 10,
    tier2Description: 'Upgraded main floor tile allowance from $40 to $50 per square metre.',
    tier3Label: '$60/m² Allowance',
    tier3CostPerUnit: 20,
    tier3Description: 'Premium main floor tile allowance of $60 per square metre.',
    position: 32,
  },

  // ─── Render ───────────────────────────────────────────────────────────────
  {
    itemKey: 'external_render',
    label: 'External Walls Render',
    category: 'Render',
    unit: 'fixed',
    tier1Label: 'Cement render system',
    tier2Label: 'Acrylic render system',
    tier2CostPerUnit: 5500,
    tier2Description: 'Acrylic render system — more flexible, crack-resistant, and wider colour range than cement render.',
    tier3Label: 'Microcement render system',
    tier3CostPerUnit: 14000,
    tier3Description: 'Microcement render system — ultra-premium seamless finish with superior durability and contemporary aesthetic.',
    position: 33,
  },
  {
    itemKey: 'render_finish',
    label: 'Render Finish / Colour',
    category: 'Render',
    unit: 'fixed',
    tier1Label: 'Choice of 1 colour',
    tier2Label: 'Choice of 2 colours',
    tier2CostPerUnit: 1200,
    tier2Description: 'Two-tone render finish — choice of 2 colours for architectural contrast and visual interest.',
    tier3Label: 'Choice of 2 colours',
    tier3CostPerUnit: 1200,
    tier3Description: 'Two-tone render finish — choice of 2 colours for architectural contrast and visual interest.',
    position: 34,
  },
  {
    itemKey: 'face_brick',
    label: 'Face Brick',
    category: 'Render',
    unit: 'fixed',
    tier1Label: 'Builders $1 Range',
    tier2Label: 'Builders $1.50 Range',
    tier2CostPerUnit: 3000,
    tier2Description: 'Upgraded face brick from Builders $1.50 range — wider selection of premium colours and textures.',
    tier3Label: 'Premium range (project specific)',
    tier3CostPerUnit: 6000,
    tier3Description: 'Premium face brick selection — project-specific specification from designer ranges.',
    position: 35,
  },

  // ─── Electrical (missing items) ───────────────────────────────────────────
  {
    itemKey: 'wall_lights',
    label: 'Wall Lights',
    category: 'Electrical',
    unit: 'each',
    tier1Label: 'Not included',
    tier2Label: '8 Wall Lights (Builders Range)',
    tier2CostPerUnit: 180,
    tier2Description: '8 wall lights from Builders Range — ambient accent lighting for living areas and hallways.',
    tier3Label: '8 Wall Lights (Builders Range, Automated Smart Home)',
    tier3CostPerUnit: 350,
    tier3Description: '8 wall lights from Builders Range with Loxone smart home automation — scene control and scheduling.',
    position: 36,
  },
  {
    itemKey: 'smoke_detectors',
    label: 'Smoke Detectors',
    category: 'Electrical',
    unit: 'fixed',
    tier1Label: 'Hardwired with battery backup',
    tier2Label: 'Hardwired with battery backup',
    tier2CostPerUnit: 0,
    tier2Description: 'Hardwired smoke detectors with battery backup — same across all tiers (code requirement).',
    tier3Label: 'Hardwired with battery backup',
    tier3CostPerUnit: 0,
    tier3Description: 'Hardwired smoke detectors with battery backup — same across all tiers (code requirement).',
    position: 37,
  },
  {
    itemKey: 'home_automation',
    label: 'Home Automation',
    category: 'Electrical',
    unit: 'fixed',
    tier1Label: 'Not included',
    tier2Label: 'Not included',
    tier2CostPerUnit: 0,
    tier2Description: 'Home automation not included in Tailored Living tier.',
    tier3Label: 'Loxone automation of heating and cooling',
    tier3CostPerUnit: 8000,
    tier3Description: 'Loxone smart home automation of heating and cooling — automated scheduling, presence detection, and remote app control.',
    position: 38,
  },

  // ─── Insulation (missing sound insulation) ────────────────────────────────
  {
    itemKey: 'sound_insulation',
    label: 'Sound Insulation',
    category: 'Insulation',
    unit: 'fixed',
    tier1Label: 'Not included',
    tier2Label: 'R2.7 Wet Area internal walls',
    tier2CostPerUnit: 2200,
    tier2Description: 'R2.7 acoustic insulation in wet area internal walls — reduced noise transfer between bathrooms and living areas.',
    tier3Label: 'R2.7 Wet Area internal walls and in between floors',
    tier3CostPerUnit: 4800,
    tier3Description: 'R2.7 acoustic insulation in wet area walls plus between-floor insulation — maximum noise reduction throughout.',
    position: 39,
  },

  // ─── Plasterboard (entirely new category) ─────────────────────────────────
  {
    itemKey: 'plasterboard_walls',
    label: 'Plasterboard Walls',
    category: 'Plasterboard',
    unit: 'fixed',
    tier1Label: '10mm Standard plasterboard',
    tier2Label: '13mm Standard plasterboard',
    tier2CostPerUnit: 2500,
    tier2Description: 'Upgraded to 13mm plasterboard walls — improved acoustic performance and structural rigidity.',
    tier3Label: '13mm Standard plasterboard',
    tier3CostPerUnit: 2500,
    tier3Description: 'Upgraded to 13mm plasterboard walls — improved acoustic performance and structural rigidity.',
    position: 40,
  },
  {
    itemKey: 'plasterboard_ceilings',
    label: 'Plasterboard Ceilings',
    category: 'Plasterboard',
    unit: 'fixed',
    tier1Label: '10mm Standard plasterboard',
    tier2Label: '10mm Standard plasterboard',
    tier2CostPerUnit: 0,
    tier2Description: '10mm standard plasterboard ceilings — same across all tiers.',
    tier3Label: '10mm Standard plasterboard',
    tier3CostPerUnit: 0,
    tier3Description: '10mm standard plasterboard ceilings — same across all tiers.',
    position: 41,
  },
  {
    itemKey: 'cornice',
    label: 'Cornice',
    category: 'Plasterboard',
    unit: 'fixed',
    tier1Label: 'Standard cove cornice',
    tier2Label: 'Square Set Cornice',
    tier2CostPerUnit: 4500,
    tier2Description: 'Square set cornice — clean, contemporary flush junction between walls and ceiling.',
    tier3Label: 'Square Set Cornice',
    tier3CostPerUnit: 4500,
    tier3Description: 'Square set cornice — clean, contemporary flush junction between walls and ceiling.',
    position: 42,
  },
  {
    itemKey: 'square_set_windows_doors',
    label: 'Square Set Windows & Doors',
    category: 'Plasterboard',
    unit: 'fixed',
    tier1Label: 'Not included',
    tier2Label: 'Not included',
    tier2CostPerUnit: 0,
    tier2Description: 'Square set windows and doors not included in Tailored Living tier.',
    tier3Label: 'Square Set Windows and Doors',
    tier3CostPerUnit: 6000,
    tier3Description: 'Square set reveals around all windows and doors — seamless architectural finish eliminating traditional architraves.',
    position: 43,
  },

  // ─── Fixout Material (missing items) ──────────────────────────────────────
  {
    itemKey: 'skirting_boards',
    label: 'Skirting Boards',
    category: 'Fixout Material',
    unit: 'lm',
    tier1Label: 'Standard profile',
    tier2Label: '130mm skirting boards',
    tier2CostPerUnit: 12,
    tier2Description: 'Upgraded 130mm skirting boards — taller profile for a more substantial, premium look.',
    tier3Label: 'Shadowline Skirting',
    tier3CostPerUnit: 35,
    tier3Description: 'Shadowline skirting — recessed shadow gap detail for ultra-clean contemporary finish.',
    position: 44,
  },
  {
    itemKey: 'architraves',
    label: 'Architraves',
    category: 'Fixout Material',
    unit: 'lm',
    tier1Label: 'Standard profile',
    tier2Label: '90mm architraves',
    tier2CostPerUnit: 8,
    tier2Description: 'Upgraded 90mm architraves — wider profile for a more refined door and window surround.',
    tier3Label: 'Square set (no architraves)',
    tier3CostPerUnit: 0,
    tier3Description: 'Square set window and door reveals eliminate the need for traditional architraves — included in square set package.',
    position: 45,
  },

  // ─── Joinery (missing linen cupboard) ─────────────────────────────────────
  {
    itemKey: 'linen_cupboard',
    label: 'Linen Cupboard',
    category: 'Joinery',
    unit: 'fixed',
    tier1Label: 'Shelving included',
    tier2Label: 'Shelving included',
    tier2CostPerUnit: 0,
    tier2Description: 'Linen cupboard with shelving — same across all tiers.',
    tier3Label: 'Shelving included',
    tier3CostPerUnit: 0,
    tier3Description: 'Linen cupboard with shelving — same across all tiers.',
    position: 46,
  },

  // ─── Staircase (entirely new category) ────────────────────────────────────
  {
    itemKey: 'staircase',
    label: 'Staircase',
    category: 'Staircase',
    unit: 'fixed',
    tier1Label: 'MDF Staircase with first floor floor finish',
    tier2Label: 'Single stringer steel staircase with hardwood treads',
    tier2CostPerUnit: 12000,
    tier2Description: 'Single stringer steel staircase with hardwood treads — architectural open-tread design.',
    tier3Label: 'Single stringer steel staircase with hardwood treads and LED Strip lighting',
    tier3CostPerUnit: 18000,
    tier3Description: 'Single stringer steel staircase with hardwood treads and integrated LED strip lighting — the ultimate statement piece.',
    position: 47,
  },
  {
    itemKey: 'balustrade',
    label: 'Balustrade',
    category: 'Staircase',
    unit: 'fixed',
    tier1Label: 'Frameless Glass Balustrade',
    tier2Label: 'Frameless glass balustrade',
    tier2CostPerUnit: 0,
    tier2Description: 'Frameless glass balustrade — same premium safety glass across all tiers.',
    tier3Label: 'Frameless glass balustrade',
    tier3CostPerUnit: 0,
    tier3Description: 'Frameless glass balustrade — same premium safety glass across all tiers.',
    position: 48,
  },
];

// ─── UPDATES to existing rules (match PDF descriptions) ─────────────────────
const updates = [
  {
    itemKey: 'downlights',
    tier1Label: '50 LED downlights',
    tier2Label: '50 LED downlights',
    tier2Description: '50 LED downlights — same quantity across all tiers.',
    tier3Label: '50 LED downlights (Loxone Home Automation)',
    tier3Description: '50 LED downlights with Loxone Home Automation — smart scene control, dimming, and scheduling.',
  },
  {
    itemKey: 'power_points',
    tier1Label: '20 Double power points throughout',
    tier2Label: '30 Double power points throughout',
    tier2Description: '30 double power points throughout — 10 additional outlets for convenience.',
    tier3Label: '30 Double power points throughout',
    tier3Description: '30 double power points throughout — same as Tailored Living.',
  },
  {
    itemKey: 'switch_plates',
    tier1Label: 'Builder Range switches',
    tier2Label: 'Luxury Range switches',
    tier2Description: 'Luxury Range switch plates — premium finish and tactile feel.',
    tier3Label: 'Loxone Smart Home Switch',
    tier3Description: 'Loxone Smart Home Switch — capacitive touch with scene control, dimming, and automation.',
  },
  {
    itemKey: 'data_points',
    tier1Label: '2 Data Points',
    tier2Label: '6 Data Points',
    tier2Description: '6 data points — expanded connectivity throughout the home.',
    tier3Label: '8 Data Points',
    tier3Description: '8 data points — maximum connectivity for smart home and home office setups.',
  },
  {
    itemKey: 'exhaust_fans',
    tier1Label: 'Exhaust fans in bathrooms',
    tier2Label: '3IXL exhaust fans in bathrooms',
    tier2Description: '3IXL exhaust fans in bathrooms — premium brand with superior extraction and quieter operation.',
    tier3Label: '3IXL exhaust fans in bathrooms',
    tier3Description: '3IXL exhaust fans in bathrooms — premium brand with superior extraction and quieter operation.',
  },
  {
    itemKey: 'basin_mixers',
    tier1Label: 'Caroma Luna taps & mixers',
    tier2Label: 'ABI Interiors Milani taps & mixers',
    tier2Description: 'ABI Interiors Milani taps & mixers — premium designer profile with ceramic disc cartridge.',
    tier3Label: 'ABI Interiors Milani taps & mixers',
    tier3Description: 'ABI Interiors Milani taps & mixers — premium designer profile with ceramic disc cartridge.',
  },
  {
    itemKey: 'shower_sets',
    tier1Label: 'Caroma Urbane shower set',
    tier2Label: 'ABI Interiors Finley All In One shower set',
    tier2Description: 'ABI Interiors Finley All In One shower set — integrated overhead and hand shower in premium finish.',
    tier3Label: 'ABI Interiors Finley All In One shower set',
    tier3Description: 'ABI Interiors Finley All In One shower set — integrated overhead and hand shower in premium finish.',
  },
  {
    itemKey: 'baths',
    tier1Label: 'Caroma Free Standing bath',
    tier2Label: 'ABI Interiors Scala bath',
    tier2Description: 'ABI Interiors Scala freestanding bath — premium designer form with clean lines.',
    tier3Label: 'ABI Interiors Scala bath',
    tier3Description: 'ABI Interiors Scala freestanding bath — premium designer form with clean lines.',
  },
  {
    itemKey: 'toilets',
    tier1Label: 'Caroma Luna toilet',
    tier2Label: 'ABI Interiors Asher toilet',
    tier2Description: 'ABI Interiors Asher toilet — premium wall-faced design with soft-close seat.',
    tier3Label: 'ABI Interiors Asher toilet',
    tier3Description: 'ABI Interiors Asher toilet — premium wall-faced design with soft-close seat.',
  },
  {
    itemKey: 'appliances',
    tier1Label: 'Westinghouse appliance package',
    tier2Label: 'SMEG Classic appliance package',
    tier2Description: 'SMEG Classic appliance package — oven, cooktop, rangehood, and dishwasher.',
    tier3Label: 'Fisher and Paykel Classic appliance package',
    tier3Description: 'Fisher and Paykel Classic appliance package — premium integrated oven, cooktop, rangehood, and dishwasher.',
  },
  {
    itemKey: 'kitchen_benchtop',
    tier1Label: '20mm Engineered builders range stone',
    tier2Label: '40mm Engineered stone to Kitchen, 20mm vanity (Tailored Living Range)',
    tier2Description: '40mm engineered stone kitchen benchtop with 20mm vanity tops from Tailored Living Range.',
    tier3Label: '40mm Marble stone to Kitchen, 20mm vanity ($3000 Slab Allowance)',
    tier3Description: '40mm marble stone kitchen benchtop with 20mm vanity tops — $3,000 slab allowance for premium natural stone.',
  },
  {
    itemKey: 'kitchen_cabinetry',
    tier1Label: 'Laminate finish, soft-close joinery cabinets',
    tier2Label: 'Laminate finish, soft-close joinery cabinets',
    tier2Description: 'Laminate finish joinery cabinets with soft-close — same as Built for Excellence.',
    tier3Label: 'Shaker Door with Builders handles',
    tier3Description: 'Shaker door style joinery cabinets with builders handles — classic premium profile.',
  },
  {
    itemKey: 'splashback',
    tier1Label: '$40/m² tile allowance (kitchen splashback)',
    tier2Label: '20mm Stone splashback (Tailored Living Range)',
    tier2Description: '20mm stone splashback from Tailored Living Range — seamless stone finish matching benchtop.',
    tier3Label: '20mm Stone splashback',
    tier3Description: '20mm stone splashback — seamless premium finish matching benchtop.',
  },
  {
    itemKey: 'wardrobe_joinery',
    tier1Label: 'Built-in wardrobes with sliding doors',
    tier2Label: 'Built-in with sliding doors, WIR Laminate',
    tier2Description: 'Built-in wardrobes with sliding doors plus walk-in robe in laminate finish.',
    tier3Label: 'Built-in Laminate with doors, WIR Laminate',
    tier3Description: 'Built-in laminate wardrobes with hinged doors plus walk-in robe in laminate finish.',
  },
  {
    itemKey: 'internal_doors',
    tier1Label: 'Hollow core internal doors',
    tier2Label: 'Linear Design Hollow core internal doors',
    tier2Description: 'Linear design hollow core internal doors — contemporary grooved panel design.',
    tier3Label: 'Linear Design Hollow core internal doors',
    tier3Description: 'Linear design hollow core internal doors — contemporary grooved panel design.',
  },
  {
    itemKey: 'door_handles',
    tier1Label: 'Standard chrome finish door hardware',
    tier2Label: 'ABI Interiors door hardware',
    tier2Description: 'ABI Interiors door hardware — premium designer handles matching tapware finish.',
    tier3Label: 'ABI Interiors door hardware',
    tier3Description: 'ABI Interiors door hardware — premium designer handles matching tapware finish.',
  },
  {
    itemKey: 'insulation',
    tier1Label: 'R4.0 ceiling batts + R2.0 wall batts',
    tier2Label: 'R4.0 ceiling batts + R2.0 wall batts',
    tier2Description: 'R4.0 ceiling and R2.0 wall insulation — same as Built for Excellence.',
    tier3Label: 'R6.0 ceiling batts + R2.5 wall batts',
    tier3Description: 'R6.0 ceiling and R2.5 wall insulation — maximum thermal performance.',
  },
  {
    itemKey: 'air_conditioning',
    tier1Label: 'Ducted air conditioning — 16KW',
    tier2Label: 'Ducted air conditioning — 20KW',
    tier2Description: 'Ducted air conditioning upgraded to 20KW — increased capacity for larger zones.',
    tier3Label: 'Ducted air conditioning — 2 No. 12KW Systems for Each Floor',
    tier3Description: 'Dual 12KW ducted systems — one per floor for independent zone control and maximum comfort.',
  },
];

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  // Insert new rules
  for (const rule of newRules) {
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
        rule.tier1Label, null,
        rule.tier2Label, rule.tier2CostPerUnit, null, rule.tier2Description,
        rule.tier3Label, rule.tier3CostPerUnit, null, rule.tier3Description,
        rule.position,
      ]
    );
    inserted++;
  }

  // Update existing rules to match PDF descriptions
  for (const upd of updates) {
    const setClauses = [];
    const values = [];
    for (const [key, val] of Object.entries(upd)) {
      if (key === 'itemKey') continue;
      setClauses.push(`${key} = ?`);
      values.push(val);
    }
    values.push(upd.itemKey);
    await conn.execute(
      `UPDATE upgrade_pricing_rules SET ${setClauses.join(', ')} WHERE itemKey = ?`,
      values
    );
    updated++;
  }

  console.log(`Done: ${inserted} new rules inserted, ${skipped} already existed, ${updated} existing rules updated.`);
  await conn.end();
}

main().catch(console.error);
