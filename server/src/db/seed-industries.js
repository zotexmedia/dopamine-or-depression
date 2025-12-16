// Seed industries table with Apollo industry data
import { query, pool } from './database.js';

const apolloIndustries = [
  { name: "Hospital & Health Care", percentage: 24.9567, keywords: "hospital, health system, medical center, urgent care, emergency room" },
  { name: "Renewables & Environment", percentage: 5.8740, keywords: "solar company, wind farm, renewable energy, clean energy" },
  { name: "Financial Services", percentage: 5.4735, keywords: "wealth management, financial advisor, financial planner, fiduciary" },
  { name: "Capital Markets", percentage: 4.9024, keywords: "stock exchange, brokerage, trading firm, securities" },
  { name: "Banking", percentage: 4.0851, keywords: "bank, credit union, savings and loan, commercial bank" },
  { name: "Higher Education", percentage: 3.6748, keywords: "university, college, community college, graduate school" },
  { name: "Information Technology & Services", percentage: 3.5525, keywords: "it company, managed it, msp, it consulting" },
  { name: "Agriculture", percentage: 2.4556, keywords: "farm, agricultural, crop production, agribusiness" },
  { name: "Transportation/Trucking/Railroad", percentage: 2.4531, keywords: "trucking company, freight carrier, railroad, ltl carrier" },
  { name: "Philanthropy", percentage: 2.4366, keywords: "foundation, grant maker, philanthropic, endowment" },
  { name: "Mental Health Care", percentage: 2.2103, keywords: "psychiatric, psychologist, therapist office, counseling center, behavioral health" },
  { name: "Gambling & Casinos", percentage: 2.0960, keywords: "casino, gaming, gambling, slot machine" },
  { name: "Consumer Electronics", percentage: 2.0508, keywords: "electronics store, appliance store, consumer electronics" },
  { name: "Retail", percentage: 2.0231, keywords: "retail store, retail chain, department store, big box" },
  { name: "Research", percentage: 1.8912, keywords: "research lab, research institute, r&d center, laboratory" },
  { name: "Law Practice", percentage: 1.8596, keywords: "law firm, attorney, lawyer, legal counsel, litigation" },
  { name: "Medical Practice", percentage: 1.7845, keywords: "physician office, doctor office, medical clinic, primary care, pediatrician" },
  { name: "Hospitality", percentage: 1.7798, keywords: "hotel, motel, resort, inn, lodging" },
  { name: "Public Safety", percentage: 1.7335, keywords: "fire department, ems, emergency services, 911" },
  { name: "Medical Devices", percentage: 1.6479, keywords: "medical device, surgical equipment, diagnostic equipment, implant manufacturer" },
  { name: "Machinery", percentage: 1.6308, keywords: "machine manufacturer, industrial machinery, heavy equipment maker" },
  { name: "Outsourcing/Offshoring", percentage: 1.5303, keywords: "bpo, call center, outsourcing company, offshore" },
  { name: "Construction", percentage: 1.4076, keywords: "general contractor, construction company, builder, home builder" },
  { name: "Religious Institutions", percentage: 1.3082, keywords: "church, synagogue, mosque, temple, ministry" },
  { name: "Commercial Real Estate", percentage: 1.1900, keywords: "commercial property, office leasing, retail leasing, cbre, jll" },
  { name: "Venture Capital & Private Equity", percentage: 1.1897, keywords: "venture capital, private equity firm, vc fund, pe firm" },
  { name: "Pharmaceuticals", percentage: 1.1568, keywords: "pharmaceutical company, drug manufacturer, pharma, biopharmaceutical" },
  { name: "Oil & Energy", percentage: 1.1506, keywords: "oil company, gas company, petroleum, refinery, drilling" },
  { name: "Primary/Secondary Education", percentage: 1.1412, keywords: "school district, elementary school, middle school, high school, k-12" },
  { name: "Airlines/Aviation", percentage: 1.1132, keywords: "airline, air carrier, aviation company, airport" },
  { name: "Leisure, Travel & Tourism", percentage: 0.9166, keywords: "travel agency, tour operator, cruise line, vacation" },
  { name: "Restaurants", percentage: 0.9093, keywords: "restaurant chain, fast food, casual dining, fine dining restaurant" },
  { name: "Media Production", percentage: 0.8592, keywords: "video production, film production company, production house" },
  { name: "Package/Freight Delivery", percentage: 0.8340, keywords: "courier, parcel delivery, ups, fedex, dhl" },
  { name: "Professional Training & Coaching", percentage: 0.8108, keywords: "corporate trainer, executive coach, leadership training" },
  { name: "Insurance", percentage: 0.8056, keywords: "insurance company, insurance carrier, underwriter, insurance agency" },
  { name: "Military", percentage: 0.7018, keywords: "military base, armed forces, defense department, army, navy" },
  { name: "Alternative Medicine", percentage: 0.6918, keywords: "chiropractor, acupuncture clinic, naturopath, holistic health" },
  { name: "Real Estate", percentage: 0.6794, keywords: "real estate brokerage, realtor, realty company, real estate agent" },
  { name: "Newspapers", percentage: 0.6787, keywords: "newspaper, daily news, press, gazette" },
  { name: "Accounting", percentage: 0.6778, keywords: "cpa firm, accounting firm, tax preparation, bookkeeper, auditor" },
  { name: "Automotive", percentage: 0.6315, keywords: "car manufacturer, auto parts, car dealership, automotive supplier" },
  { name: "Biotechnology", percentage: 0.6095, keywords: "biotech company, gene therapy, molecular biology, bioscience" },
  { name: "Government Administration", percentage: 0.5694, keywords: "city government, county government, state agency, federal agency" },
  { name: "Supermarkets", percentage: 0.5690, keywords: "supermarket, grocery store, grocery chain, food market" },
  { name: "Investment Banking", percentage: 0.5230, keywords: "investment bank, m&a advisor, goldman sachs, morgan stanley" },
  { name: "Museums & Institutions", percentage: 0.4612, keywords: "museum, art museum, history museum, science museum" },
  { name: "Warehousing", percentage: 0.4412, keywords: "warehouse company, distribution center, cold storage, 3pl warehouse" },
  { name: "Health, Wellness & Fitness", percentage: 0.4262, keywords: "gym, fitness center, health club, yoga studio, personal trainer" },
  { name: "Computer & Network Security", percentage: 0.4253, keywords: "cybersecurity company, infosec, penetration testing, soc" },
  { name: "E-Learning", percentage: 0.4240, keywords: "online course, elearning platform, lms provider, educational technology" },
  { name: "Staffing & Recruiting", percentage: 0.4193, keywords: "staffing agency, recruiting firm, headhunter, temp agency, employment agency" },
  { name: "Logistics & Supply Chain", percentage: 0.4156, keywords: "3pl, freight broker, supply chain company, fulfillment center" },
  { name: "Public Policy", percentage: 0.4134, keywords: "policy institute, think tank, policy research" },
  { name: "Sporting Goods", percentage: 0.3995, keywords: "sporting goods store, sports equipment, athletic gear" },
  { name: "Environmental Services", percentage: 0.3992, keywords: "waste hauler, garbage collection, recycling company, waste disposal" },
  { name: "Wine & Spirits", percentage: 0.3917, keywords: "winery, vineyard, distillery, brewery, craft beer" },
  { name: "Furniture", percentage: 0.3715, keywords: "furniture store, furniture manufacturer, office furniture" },
  { name: "Civic & Social Organization", percentage: 0.3593, keywords: "rotary, lions club, chamber of commerce, trade association" },
  { name: "Facilities Services", percentage: 0.3522, keywords: "janitorial company, cleaning company, custodial services, commercial cleaning" },
  { name: "Motion Pictures & Film", percentage: 0.3403, keywords: "film studio, movie studio, film production, hollywood" },
  { name: "Civil Engineering", percentage: 0.3315, keywords: "civil engineering firm, structural engineer, geotechnical" },
  { name: "Utilities", percentage: 0.3211, keywords: "electric utility, gas utility, water utility, power company" },
  { name: "Internet", percentage: 0.3164, keywords: "web company, dot com, internet company, online platform" },
  { name: "Marketing & Advertising", percentage: 0.3113, keywords: "ad agency, advertising agency, media buyer, creative agency" },
  { name: "Chemicals", percentage: 0.3072, keywords: "chemical manufacturer, chemical plant, specialty chemicals" },
  { name: "Luxury Goods & Jewelry", percentage: 0.2952, keywords: "jewelry store, luxury brand, watch manufacturer, jeweler" },
  { name: "Investment Management", percentage: 0.2863, keywords: "asset manager, hedge fund, mutual fund, portfolio manager" },
  { name: "Design", percentage: 0.2613, keywords: "design studio, industrial design, product design firm" },
  { name: "Apparel & Fashion", percentage: 0.2568, keywords: "clothing brand, fashion brand, apparel manufacturer" },
  { name: "Judiciary", percentage: 0.2558, keywords: "courthouse, court system, judicial" },
  { name: "Legal Services", percentage: 0.2488, keywords: "paralegal, notary, legal aid, court reporter" },
  { name: "Executive Office", percentage: 0.2473, keywords: "c-suite, executive suite, corporate office" },
  { name: "Defense & Space", percentage: 0.2433, keywords: "defense contractor, military contractor, space company, spacex, nasa" },
  { name: "Semiconductors", percentage: 0.2415, keywords: "chip manufacturer, semiconductor fab, intel, amd, nvidia" },
  { name: "Telecommunications", percentage: 0.2352, keywords: "telecom company, phone company, telco, att, verizon" },
  { name: "Events Services", percentage: 0.2313, keywords: "event planner, event venue, convention center, catering company" },
  { name: "Individual & Family Services", percentage: 0.2313, keywords: "social worker, family counseling, child welfare, adoption agency" },
  { name: "Building Materials", percentage: 0.2306, keywords: "lumber yard, building supply, concrete supplier, roofing materials" },
  { name: "Aviation & Aerospace", percentage: 0.2261, keywords: "aerospace manufacturer, aircraft manufacturer, boeing, lockheed" },
  { name: "Plastics", percentage: 0.2211, keywords: "plastic manufacturer, injection molding, plastic fabrication" },
  { name: "Entertainment", percentage: 0.2193, keywords: "theme park, amusement park, entertainment venue, concert venue" },
  { name: "Education Management", percentage: 0.2115, keywords: "charter school, private school, boarding school, montessori" },
  { name: "Sports", percentage: 0.1916, keywords: "sports team, sports franchise, athletic club, sports league" },
  { name: "Fine Art", percentage: 0.1900, keywords: "art gallery, art dealer, fine art" },
  { name: "Human Resources", percentage: 0.1881, keywords: "hr outsourcing, payroll provider, benefits administrator" },
  { name: "Recreational Facilities & Services", percentage: 0.1854, keywords: "recreation center, community center, ymca, country club" },
  { name: "Industrial Automation", percentage: 0.1825, keywords: "automation company, robotics company, plc, industrial robot" },
  { name: "Legislative Office", percentage: 0.1591, keywords: "congress, senate, legislature, capitol" },
  { name: "Electrical/Electronic Manufacturing", percentage: 0.1434, keywords: "electronics manufacturer, pcb manufacturer, ems" },
  { name: "Fishery", percentage: 0.1427, keywords: "fishing company, seafood processor, fishery, aquaculture" },
  { name: "Cosmetics", percentage: 0.1387, keywords: "cosmetics company, beauty brand, skincare brand, makeup brand" },
  { name: "Computer Software", percentage: 0.1386, keywords: "software company, saas company, software developer, app developer" },
  { name: "Architecture & Planning", percentage: 0.1328, keywords: "architecture firm, architect, urban planner, landscape architect" },
  { name: "Food & Beverages", percentage: 0.1283, keywords: "beverage company, food distributor, beverage distributor" },
  { name: "Security & Investigations", percentage: 0.1266, keywords: "security guard, security company, private investigator, alarm company" },
  { name: "Government Relations", percentage: 0.1240, keywords: "lobbyist, lobbying firm, government affairs" },
  { name: "Music", percentage: 0.1214, keywords: "record label, music publisher, recording studio, music production" },
  { name: "Libraries", percentage: 0.1044, keywords: "public library, library system, academic library" },
  { name: "Nonprofit Organization Management", percentage: 0.0958, keywords: "501c3, charitable organization, ngo" },
  { name: "International Affairs", percentage: 0.0925, keywords: "embassy, consulate, diplomatic, foreign ministry" },
  { name: "Veterinary", percentage: 0.0912, keywords: "veterinary clinic, animal hospital, vet clinic, pet hospital" },
  { name: "Law Enforcement", percentage: 0.0824, keywords: "police department, sheriff, law enforcement agency" },
  { name: "Graphic Design", percentage: 0.0696, keywords: "graphic design studio, design agency, creative studio" },
  { name: "Consumer Goods", percentage: 0.0684, keywords: "cpg company, fmcg, consumer products company" },
  { name: "Program Development", percentage: 0.0659, keywords: "program manager, pmo, project management office" },
  { name: "Management Consulting", percentage: 0.0591, keywords: "mckinsey, bain, bcg, deloitte consulting, strategy consultant" },
  { name: "Dairy", percentage: 0.0587, keywords: "dairy farm, milk processor, cheese manufacturer, creamery" },
  { name: "Textiles", percentage: 0.0577, keywords: "textile mill, fabric manufacturer, weaving, dyeing" },
  { name: "Shipbuilding", percentage: 0.0567, keywords: "shipyard, ship builder, naval shipyard, boat manufacturer" },
  { name: "Farming", percentage: 0.0560, keywords: "dairy farm, cattle farm, poultry farm, hog farm" },
  { name: "Fund-Raising", percentage: 0.0532, keywords: "fundraising consultant, donor management, annual fund, capital campaign" },
  { name: "Online Media", percentage: 0.0529, keywords: "digital publisher, online news, web magazine, blog network" },
  { name: "Nanotechnology", percentage: 0.0513, keywords: "nanotech, nanomaterials, nanoscience" },
  { name: "Railroad Manufacture", percentage: 0.0511, keywords: "locomotive, railcar manufacturer, train manufacturer" },
  { name: "Translation & Localization", percentage: 0.0498, keywords: "translation agency, interpreter, localization company" },
  { name: "Broadcast Media", percentage: 0.0474, keywords: "tv station, radio station, broadcaster, television network" },
  { name: "Performing Arts", percentage: 0.0474, keywords: "theater company, ballet, opera house, symphony orchestra" },
  { name: "Animation", percentage: 0.0441, keywords: "animation studio, animator, motion graphics studio" },
  { name: "Mechanical or Industrial Engineering", percentage: 0.0375, keywords: "engineering firm, mechanical engineer, industrial engineer" },
  { name: "Food Production", percentage: 0.0327, keywords: "food manufacturer, food processing plant, packaged food company" },
  { name: "Writing & Editing", percentage: 0.0325, keywords: "copywriter, editor, content writer, technical writer" },
  { name: "Printing", percentage: 0.0315, keywords: "print shop, commercial printer, printing company" },
  { name: "International Trade & Development", percentage: 0.0314, keywords: "usaid, world bank, imf, development agency" },
  { name: "Photography", percentage: 0.0309, keywords: "photography studio, photographer, photo studio" },
  { name: "Computer Games", percentage: 0.0295, keywords: "game studio, video game developer, game publisher" },
  { name: "Market Research", percentage: 0.0279, keywords: "market research firm, survey company, focus group, nielsen" },
  { name: "Information Services", percentage: 0.0273, keywords: "data provider, information broker, data aggregator" },
  { name: "Paper & Forest Products", percentage: 0.0251, keywords: "paper mill, pulp mill, lumber mill, sawmill" },
  { name: "Import & Export", percentage: 0.0243, keywords: "import company, export company, customs broker, freight forwarder" },
  { name: "Political Organization", percentage: 0.0240, keywords: "political party, pac, campaign committee" },
  { name: "Public Relations & Communications", percentage: 0.0162, keywords: "pr firm, public relations firm, communications agency" },
  { name: "Maritime", percentage: 0.0124, keywords: "shipping line, cargo ship, port operator, maritime company" },
  { name: "Wireless", percentage: 0.0118, keywords: "wireless carrier, cell phone company, mobile carrier" },
  { name: "Mining & Metals", percentage: 0.0112, keywords: "mining company, mine operator, metal producer, ore extraction" },
  { name: "Packaging & Containers", percentage: 0.0103, keywords: "packaging company, box manufacturer, container manufacturer" },
  { name: "Publishing", percentage: 0.0088, keywords: "book publisher, magazine publisher, publishing house" },
  { name: "Alternative Dispute Resolution", percentage: 0.0080, keywords: "mediator, arbitrator, arbitration firm" },
  { name: "Glass, Ceramics & Concrete", percentage: 0.0077, keywords: "glass manufacturer, concrete plant, ceramics manufacturer" },
  { name: "Arts & Crafts", percentage: 0.0067, keywords: "craft store, art supply, hobby shop" },
  { name: "Think Tanks", percentage: 0.0064, keywords: "brookings, heritage foundation, rand corporation, policy center" },
  { name: "Tobacco", percentage: 0.0049, keywords: "tobacco company, cigarette manufacturer" },
  { name: "Computer Networking", percentage: 0.0043, keywords: "network integrator, cisco partner, network installer" },
  { name: "Computer Hardware", percentage: 0.0032, keywords: "computer manufacturer, pc maker, hardware vendor" },
  { name: "Ranching", percentage: 0.0013, keywords: "cattle ranch, horse ranch, livestock ranch" },
];

export async function seedIndustries() {
  console.log('Seeding industries table...');

  let inserted = 0;
  let updated = 0;

  for (const industry of apolloIndustries) {
    try {
      const result = await query(`
        INSERT INTO industries (name, source, send_percentage, keywords)
        VALUES ($1, 'apollo', $2, $3)
        ON CONFLICT (name) DO UPDATE SET
          send_percentage = $2,
          keywords = $3
        RETURNING (xmax = 0) as inserted
      `, [industry.name, industry.percentage, industry.keywords]);

      if (result.rows[0]?.inserted) {
        inserted++;
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`Failed to insert ${industry.name}:`, err.message);
    }
  }

  console.log(`Industries seeded: ${inserted} inserted, ${updated} updated`);
  return { inserted, updated };
}

// Run if called directly
if (process.argv[1].includes('seed-industries')) {
  seedIndustries()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
