const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Data berdasarkan Piala Dunia 2022
const teams = [
  // Grup A
  { name: "Qatar", code: "QAT", group: "A" },
  { name: "Ecuador", code: "ECU", group: "A" },
  { name: "Senegal", code: "SEN", group: "A" },
  { name: "Netherlands", code: "NED", group: "A" },

  // Grup B
  { name: "England", code: "ENG", group: "B" },
  { name: "Iran", code: "IRN", group: "B" },
  { name: "USA", code: "USA", group: "B" },
  { name: "Wales", code: "WAL", group: "B" },

  // Grup C
  { name: "Argentina", code: "ARG", group: "C" },
  { name: "Saudi Arabia", code: "KSA", group: "C" },
  { name: "Mexico", code: "MEX", group: "C" },
  { name: "Poland", code: "POL", group: "C" },

  // Grup D
  { name: "France", code: "FRA", group: "D" },
  { name: "Australia", code: "AUS", group: "D" },
  { name: "Denmark", code: "DEN", group: "D" },
  { name: "Tunisia", code: "TUN", group: "D" },

  // Grup E
  { name: "Spain", code: "ESP", group: "E" },
  { name: "Costa Rica", code: "CRC", group: "E" },
  { name: "Germany", code: "GER", group: "E" },
  { name: "Japan", code: "JPN", group: "E" },

  // Grup F
  { name: "Belgium", code: "BEL", group: "F" },
  { name: "Canada", code: "CAN", group: "F" },
  { name: "Morocco", code: "MAR", group: "F" },
  { name: "Croatia", code: "CRO", group: "F" },

  // Grup G
  { name: "Brazil", code: "BRA", group: "G" },
  { name: "Serbia", code: "SRB", group: "G" },
  { name: "Switzerland", code: "SUI", group: "G" },
  { name: "Cameroon", code: "CMR", group: "G" },

  // Grup H
  { name: "Portugal", code: "POR", group: "H" },
  { name: "Ghana", code: "GHA", group: "H" },
  { name: "Uruguay", code: "URU", group: "H" },
  { name: "South Korea", code: "KOR", group: "H" },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  console.log("  ✅ Cleared existing data");

  // Insert teams
  for (const team of teams) {
    await prisma.team.create({ data: team });
  }
  console.log(`  ✅ ${teams.length} tim berhasil ditambahkan`);

  // Summary per grup
  const groups = {};
  for (const t of teams) {
    if (!groups[t.group]) groups[t.group] = [];
    groups[t.group].push(t.code);
  }
  for (const [g, codes] of Object.entries(groups).sort()) {
    console.log(`  Grup ${g}: ${codes.join(", ")}`);
  }

  console.log("\n🎉 Seed selesai!");
  console.log("   Buka http://localhost:3000 → Admin Panel → Setup Fase Grup");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
