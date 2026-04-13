import { createConnection } from "mysql2/promise";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663548387177/imEXQJppF9z2GgJphACuNv";

const PACKAGES = [
  {
    name: "Built for Excellence",
    tier: "entry",
    tagline: "Quality foundations, exceptional value",
    description: "Our entry package delivers quality Caroma fixtures, Westinghouse appliances, and solid construction fundamentals — everything you need to build a beautiful, functional home.",
    isRecommended: false,
    position: 1,
    heroImageUrl: `${CDN}/caroma-luna-mixer_eaa98a6d.jpg`,
    items: [
      // PC Items
      { section: "PC Items", item: "Taps & Mixers: Caroma Luna", imageUrl: `${CDN}/caroma-luna-mixer_eaa98a6d.jpg`, position: 1 },
      { section: "PC Items", item: "Basin: Caroma Liano", imageUrl: `${CDN}/caroma-liano-basin_45521c63.jpg`, position: 2 },
      { section: "PC Items", item: "Toilets: Caroma Luna", imageUrl: `${CDN}/caroma-luna-toilet_0fa3445b.jpg`, position: 3 },
      { section: "PC Items", item: "Shower: Caroma Urbane", imageUrl: `${CDN}/caroma-urbane-shower_1fb7b54c.jpg`, position: 4 },
      { section: "PC Items", item: "Baths: Caroma Free Standing", imageUrl: `${CDN}/caroma-freestanding-bath_e3ad482b.png`, position: 5 },
      { section: "PC Items", item: "Kitchen Sink: Caroma Compass", imageUrl: null, position: 6 },
      { section: "PC Items", item: "Kitchen/Laundry Mixer: Caroma Liano", imageUrl: `${CDN}/caroma-luna-mixer_eaa98a6d.jpg`, position: 7 },
      { section: "PC Items", item: "Laundry Sink: Standard laundry tub", imageUrl: null, position: 8 },
      { section: "PC Items", item: "Appliances: Westinghouse", imageUrl: `${CDN}/westinghouse-oven_80e2626b.jpg`, position: 9 },
      // Electrical
      { section: "Electrical", item: "15 double power points", imageUrl: null, position: 1 },
      { section: "Electrical", item: "25 LED downlights", imageUrl: null, position: 2 },
      { section: "Electrical", item: "2 data points", imageUrl: null, position: 3 },
      { section: "Electrical", item: "Builder range switches", imageUrl: null, position: 4 },
      { section: "Electrical", item: "Hardwired smoke detectors with battery backup", imageUrl: null, position: 5 },
      { section: "Electrical", item: "Bathroom exhaust fans", imageUrl: null, position: 6 },
      // Tiles
      { section: "Tiles", item: "Bathroom floor allowance $40/m²", imageUrl: null, position: 1 },
      { section: "Tiles", item: "Bathroom wall allowance $40/m²", imageUrl: null, position: 2 },
      { section: "Tiles", item: "Kitchen splashback allowance $40/m²", imageUrl: null, position: 3 },
      { section: "Tiles", item: "Laundry floor allowance $40/m²", imageUrl: null, position: 4 },
      { section: "Tiles", item: "Main floor allowance $40/m²", imageUrl: null, position: 5 },
      // Insulation
      { section: "Insulation", item: "Ceiling R4.0", imageUrl: null, position: 1 },
      { section: "Insulation", item: "Wall R2.0", imageUrl: null, position: 2 },
      // Joinery & Stone
      { section: "Joinery & Stone", item: "Laminate finish soft-close cabinetry", imageUrl: null, position: 1 },
      { section: "Joinery & Stone", item: "20mm engineered stone benchtops", imageUrl: null, position: 2 },
      { section: "Joinery & Stone", item: "Built-in wardrobes with sliding doors", imageUrl: null, position: 3 },
      { section: "Joinery & Stone", item: "Linen shelving included", imageUrl: null, position: 4 },
      // Plasterboard
      { section: "Plasterboard", item: "10mm walls", imageUrl: null, position: 1 },
      { section: "Plasterboard", item: "10mm ceilings", imageUrl: null, position: 2 },
      { section: "Plasterboard", item: "Standard cove cornice", imageUrl: null, position: 3 },
      // Facade
      { section: "Facade", item: "Cement render / face brick range 1", imageUrl: null, position: 1 },
      { section: "Facade", item: "1 colour selection", imageUrl: null, position: 2 },
      // Fixout
      { section: "Fixout", item: "Hollow core internal doors", imageUrl: null, position: 1 },
      { section: "Fixout", item: "Chrome standard hardware", imageUrl: null, position: 2 },
      { section: "Fixout", item: "Standard skirting and architraves", imageUrl: null, position: 3 },
      // Air Conditioning
      { section: "Air Conditioning", item: "Ducted", imageUrl: null, position: 1 },
      { section: "Air Conditioning", item: "12kW", imageUrl: null, position: 2 },
    ],
  },
  {
    name: "Tailored Living",
    tier: "mid",
    tagline: "Elevated style, thoughtfully designed",
    description: "Our recommended mid-tier package. ABI Interiors tapware, SMEG Classic appliances, and premium finishes throughout — the perfect balance of quality and value for the discerning homeowner.",
    isRecommended: true,
    position: 2,
    heroImageUrl: `${CDN}/abi-milani-tapware_9b10f2c3.jpg`,
    items: [
      // PC Items
      { section: "PC Items", item: "ABI Interiors Milani tapware", imageUrl: `${CDN}/abi-milani-tapware_9b10f2c3.jpg`, position: 1 },
      { section: "PC Items", item: "ABI Lola basin", imageUrl: `${CDN}/abi-lola-basin_42dff055.jpg`, position: 2 },
      { section: "PC Items", item: "ABI shower set", imageUrl: null, position: 3 },
      { section: "PC Items", item: "ABI Asher toilet", imageUrl: `${CDN}/abi-asher-toilet_59f97d94.jpg`, position: 4 },
      { section: "PC Items", item: "ABI Scala bath", imageUrl: `${CDN}/abi-scala-bath_8dd22fc7.jpg`, position: 5 },
      { section: "PC Items", item: "ABI Vienna double kitchen sink", imageUrl: null, position: 6 },
      { section: "PC Items", item: "ABI Elysian kitchen/laundry mixers", imageUrl: `${CDN}/abi-milani-tapware_9b10f2c3.jpg`, position: 7 },
      { section: "PC Items", item: "SMEG Classic appliances", imageUrl: `${CDN}/smeg-classic-oven_ac2edd77.jpg`, position: 8 },
      // Electrical
      { section: "Electrical", item: "20 double power points", imageUrl: null, position: 1 },
      { section: "Electrical", item: "40 LED downlights", imageUrl: null, position: 2 },
      { section: "Electrical", item: "8 wall lights", imageUrl: null, position: 3 },
      { section: "Electrical", item: "4 data points", imageUrl: null, position: 4 },
      { section: "Electrical", item: "Luxury switch range", imageUrl: null, position: 5 },
      { section: "Electrical", item: "Bathroom exhaust fans", imageUrl: null, position: 6 },
      // Tiles
      { section: "Tiles", item: "All tile allowances $50/m²", imageUrl: null, position: 1 },
      // Insulation
      { section: "Insulation", item: "Ceiling R4.0", imageUrl: null, position: 1 },
      { section: "Insulation", item: "Wall R2.0", imageUrl: null, position: 2 },
      { section: "Insulation", item: "Wet area sound insulation R2.7", imageUrl: null, position: 3 },
      // Joinery & Stone
      { section: "Joinery & Stone", item: "Laminate soft-close joinery", imageUrl: null, position: 1 },
      { section: "Joinery & Stone", item: "40mm engineered stone kitchen benchtop", imageUrl: null, position: 2 },
      { section: "Joinery & Stone", item: "20mm vanity stone", imageUrl: null, position: 3 },
      { section: "Joinery & Stone", item: "20mm stone splashback", imageUrl: null, position: 4 },
      { section: "Joinery & Stone", item: "WIR laminate cabinetry", imageUrl: null, position: 5 },
      // Plasterboard
      { section: "Plasterboard", item: "13mm walls", imageUrl: null, position: 1 },
      { section: "Plasterboard", item: "10mm ceilings", imageUrl: null, position: 2 },
      { section: "Plasterboard", item: "Square set cornice", imageUrl: null, position: 3 },
      // Facade
      { section: "Facade", item: "Acrylic render / face brick range 1.2", imageUrl: null, position: 1 },
      { section: "Facade", item: "2 colour selection", imageUrl: null, position: 2 },
      // Fixout
      { section: "Fixout", item: "Linear design hollow core doors", imageUrl: null, position: 1 },
      { section: "Fixout", item: "ABI door hardware", imageUrl: null, position: 2 },
      { section: "Fixout", item: "130mm skirting", imageUrl: null, position: 3 },
      { section: "Fixout", item: "90mm architraves", imageUrl: null, position: 4 },
      // Air Conditioning
      { section: "Air Conditioning", item: "Ducted", imageUrl: null, position: 1 },
      { section: "Air Conditioning", item: "16kW", imageUrl: null, position: 2 },
    ],
  },
  {
    name: "Signature Series",
    tier: "premium",
    tagline: "Uncompromising luxury, signature craftsmanship",
    description: "The pinnacle of B Modern's offering. Fisher & Paykel appliances, Loxone smart home automation, marble benchtops, shaker joinery, and the finest finishes — for those who demand the very best.",
    isRecommended: false,
    position: 3,
    heroImageUrl: `${CDN}/shaker-joinery_89279ae8.webp`,
    items: [
      // PC Items
      { section: "PC Items", item: "ABI Interiors Milani tapware", imageUrl: `${CDN}/abi-milani-tapware_9b10f2c3.jpg`, position: 1 },
      { section: "PC Items", item: "ABI Lola basin", imageUrl: `${CDN}/abi-lola-basin_42dff055.jpg`, position: 2 },
      { section: "PC Items", item: "ABI Finley shower set", imageUrl: null, position: 3 },
      { section: "PC Items", item: "ABI Asher toilet", imageUrl: `${CDN}/abi-asher-toilet_59f97d94.jpg`, position: 4 },
      { section: "PC Items", item: "ABI Scala bath", imageUrl: `${CDN}/abi-scala-bath_8dd22fc7.jpg`, position: 5 },
      { section: "PC Items", item: "ABI Vienna sinks", imageUrl: null, position: 6 },
      { section: "PC Items", item: "Fisher & Paykel Classic appliances", imageUrl: `${CDN}/fisher-paykel-oven_bd60484f.jpg`, position: 7 },
      // Electrical
      { section: "Electrical", item: "30 double power points", imageUrl: null, position: 1 },
      { section: "Electrical", item: "50 LED downlights", imageUrl: null, position: 2 },
      { section: "Electrical", item: "8 wall lights", imageUrl: null, position: 3 },
      { section: "Electrical", item: "8 data points", imageUrl: null, position: 4 },
      { section: "Electrical", item: "Loxone smart switches", imageUrl: null, position: 5 },
      { section: "Electrical", item: "Smart home automation", imageUrl: null, position: 6 },
      { section: "Electrical", item: "Heating and cooling automation", imageUrl: null, position: 7 },
      // Tiles
      { section: "Tiles", item: "All tile allowances $60/m²", imageUrl: null, position: 1 },
      // Insulation
      { section: "Insulation", item: "Ceiling R6.0", imageUrl: null, position: 1 },
      { section: "Insulation", item: "Walls R2.5", imageUrl: null, position: 2 },
      { section: "Insulation", item: "Wet area sound insulation R2.7", imageUrl: null, position: 3 },
      // Joinery & Stone
      { section: "Joinery & Stone", item: "Shaker joinery", imageUrl: `${CDN}/shaker-joinery_89279ae8.webp`, position: 1 },
      { section: "Joinery & Stone", item: "Builder handles", imageUrl: null, position: 2 },
      { section: "Joinery & Stone", item: "40mm marble kitchen benchtop", imageUrl: `${CDN}/marble-benchtop_7c7c49ba.jpg`, position: 3 },
      { section: "Joinery & Stone", item: "20mm vanity stone", imageUrl: null, position: 4 },
      { section: "Joinery & Stone", item: "20mm stone splashback", imageUrl: null, position: 5 },
      { section: "Joinery & Stone", item: "Wardrobe and WIR laminate cabinetry", imageUrl: null, position: 6 },
      // Plasterboard
      { section: "Plasterboard", item: "13mm walls", imageUrl: null, position: 1 },
      { section: "Plasterboard", item: "10mm ceilings", imageUrl: null, position: 2 },
      { section: "Plasterboard", item: "Square set", imageUrl: null, position: 3 },
      { section: "Plasterboard", item: "Square set windows and doors", imageUrl: null, position: 4 },
      // Facade
      { section: "Facade", item: "Face brick range 2.5", imageUrl: null, position: 1 },
      { section: "Facade", item: "2 colour selection", imageUrl: null, position: 2 },
      // Fixout
      { section: "Fixout", item: "Linear design doors", imageUrl: null, position: 1 },
      { section: "Fixout", item: "ABI hardware", imageUrl: null, position: 2 },
      { section: "Fixout", item: "Shadowline skirting", imageUrl: null, position: 3 },
      // Air Conditioning
      { section: "Air Conditioning", item: "Ducted", imageUrl: null, position: 1 },
      { section: "Air Conditioning", item: "20kW", imageUrl: null, position: 2 },
    ],
  },
];

async function seed() {
  const conn = await createConnection(process.env.DATABASE_URL);
  
  // Clear existing packages
  await conn.execute("DELETE FROM master_package_items");
  await conn.execute("DELETE FROM master_packages");
  
  for (const pkg of PACKAGES) {
    const [result] = await conn.execute(
      "INSERT INTO master_packages (name, tier, tagline, description, isRecommended, position, heroImageUrl) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [pkg.name, pkg.tier, pkg.tagline, pkg.description, pkg.isRecommended ? 1 : 0, pkg.position, pkg.heroImageUrl]
    );
    const packageId = result.insertId;
    
    for (const item of pkg.items) {
      await conn.execute(
        "INSERT INTO master_package_items (packageId, section, item, imageUrl, position) VALUES (?, ?, ?, ?, ?)",
        [packageId, item.section, item.item, item.imageUrl, item.position]
      );
    }
    console.log(`Seeded: ${pkg.name} (${pkg.items.length} items)`);
  }
  
  await conn.end();
  console.log("Done!");
}

seed().catch(e => { console.error(e); process.exit(1); });
