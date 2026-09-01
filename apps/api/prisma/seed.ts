/**
 * Seed data for the Eger Város Probléma Térkép.
 *
 * Run with: `pnpm --filter @eger/api db:seed`
 *
 * Contents:
 *   - 20 institutions (schools, hospitals, pools, libraries, government)
 *   - 50 problems spread across the city + each institution
 *   - 100 votes from synthetic users
 *
 * The users are inserted directly via the public.users table (the auth.users
 * mirror trigger is owned by Supabase and we do not want to seed auth.users
 * here). In production, vote rows reference real Supabase auth users; for dev
 * we generate 25 synthetic UUIDs.
 *
 * Coordinates are approximate but plausible (Eger city centre ~ 47.9025°N,
 * 20.3772°E). Real coordinates come from the OSM Nominatim API when the
 * admin UI is built (V2).
 */
import { PrismaClient, InstitutionType, ProblemCategory } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedInstitution {
  name: string;
  type: InstitutionType;
  address: string;
  latitude: number;
  longitude: number;
  officialUrl?: string;
}

const SEED_INSTITUTIONS: SeedInstitution[] = [
  { name: "Egri Dobó István Gimnázium", type: "school", address: "Széchenyi István utca 19.", latitude: 47.9030, longitude: 20.3780, officialUrl: "https://www.dig.hu" },
  { name: "Egri Balassi Bálint Általános Iskola", type: "school", address: "Balassi Bálint utca 2.", latitude: 47.8985, longitude: 20.3700 },
  { name: "Eszterházy Károly Katolikus Egyetem", type: "school", address: "Eszterházy tér 1.", latitude: 47.8988, longitude: 20.3744, officialUrl: "https://www.uni-eszterhazy.hu" },
  { name: "Markhot Ferenc Oktatókórház", type: "hospital", address: "Markhot Ferenc utca 1-3.", latitude: 47.9056, longitude: 20.3780, officialUrl: "https://www.mfkh.hu" },
  { name: "Egri Rendelőintézet", type: "hospital", address: "Kossuth Lajos utca 13.", latitude: 47.9022, longitude: 20.3755 },
  { name: "Bitskey Aladár Uszoda", type: "pool", address: "Törvényház utca 4.", latitude: 47.8974, longitude: 20.3810, officialUrl: "https://www.bitskey-uszoda.hu" },
  { name: "Termál Strand (Eger)", type: "pool", address: "Petőfi tér 2.", latitude: 47.9010, longitude: 20.3850 },
  { name: "Bródy Sándor Megyei és Városi Könyvtár", type: "library", address: "Kossuth Lajos utca 18.", latitude: 47.9028, longitude: 20.3738, officialUrl: "https://www.brody.hu" },
  { name: "Egri Főegyházmegyei Könyvtár", type: "library", address: "Eszterházy tér 1.", latitude: 47.8987, longitude: 20.3745 },
  { name: "Eger Megyei Jogú Város Polgármesteri Hivatal", type: "government", address: "Dobó István tér 2.", latitude: 47.9029, longitude: 20.3772, officialUrl: "https://www.eger.hu" },
  { name: "Heves Megyei Kormányhivatal", type: "government", address: "Kossuth Lajos utca 9.", latitude: 47.9025, longitude: 20.3745 },
  { name: "Egri Járási Hivatal", type: "government", address: "Mindszenty József utca 4.", latitude: 47.9045, longitude: 20.3750 },
  { name: "Egri Szimfonikus Zenekar", type: "other", address: "Széchenyi István utca 27.", latitude: 47.9015, longitude: 20.3790 },
  { name: "Gárdonyi Géza Színház", type: "other", address: "Hatvani kapu tér 4.", latitude: 47.9030, longitude: 20.3810, officialUrl: "https://www.gsz.hu" },
  { name: "Egri Bazilika (minor bazilika)", type: "other", address: "Pyrker János tér 1.", latitude: 47.8988, longitude: 20.3760 },
  { name: "Egri Vár", type: "other", address: "Vár köz 1.", latitude: 47.8995, longitude: 20.3785, officialUrl: "https://www.egrivar.hu" },
  { name: "Sportcsarnok (Balassi út)", type: "other", address: "Balassi Bálint út 3.", latitude: 47.8945, longitude: 20.3680 },
  { name: "Egri Városi Sporttelep", type: "other", address: "Mátyás király út 53.", latitude: 47.8905, longitude: 20.3715 },
  { name: "Egri Piac (nagybani + kiskereskedelmi)", type: "other", address: "Rákóczi út 8.", latitude: 47.9055, longitude: 20.3790 },
  { name: "Líceum (Egri Érseki Palota)", type: "other", address: "Eszterházy tér 1-3.", latitude: 47.8988, longitude: 20.3745 },
];

const CATEGORIES: ProblemCategory[] = [
  "infrastructure",
  "public_safety",
  "environment",
  "institution",
  "transport",
  "other",
];

const SAMPLE_TITLES: Record<ProblemCategory, string[]> = {
  infrastructure: [
    "Kátyú a Széchenyi utcában",
    "Törött járdalap a Kossuth utcán",
    "Nem működő közvilágítás a Vár környékén",
    "Kiépítetlen csapadékvíz-elvezető a Rákóczi úton",
  ],
  public_safety: [
    "Sötét átkelő a Hatvani kapunál",
    "Hiányzó közlekedési tábla a Bajza utcában",
    "Gyakori illegális parkolás a Líceum környékén",
  ],
  environment: [
    "Elhagyott hulladék a Szala-patak partján",
    "Kivágott fák a József Attila utcában",
    "Zajterhelés a Petőfi téren (éjjelente)",
  ],
  institution: [
    "Elavult fűtésrendszer a helyi iskolában",
    "Akadálymentesítés hiánya a kórház bejáratánál",
    "Rövidített nyitvatartás a könyvtárban",
  ],
  transport: [
    "Késő buszjárat a 11-es vonalon",
    "Hiányzó kerékpártároló a főtéren",
    "Hosszú várakozás a vasútállomásnál csúcsidőben",
  ],
  other: [
    "Szemetes a parkban nincs ürítve",
    "Nem működő szökőkút a Dobó téren",
    "Graffiti a művelődési ház falán",
  ],
};

function uuid(): string {
  // RFC 4122 v4 — sufficient for seed data; not for production tokens.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function main() {
  console.log("🌱 Seeding Eger Probléma Térkép database…");

  // 1. Institutions
  console.log(`  • inserting ${SEED_INSTITUTIONS.length} institutions`);
  const institutions = await Promise.all(
    SEED_INSTITUTIONS.map((inst) =>
      prisma.institution.upsert({
        where: { id: uuid() }, // no unique key on name; re-run will duplicate
        update: {},
        create: {
          name: inst.name,
          type: inst.type,
          address: inst.address,
          latitude: inst.latitude,
          longitude: inst.longitude,
          officialUrl: inst.officialUrl ?? null,
        },
      }),
    ),
  );

  // 2. Synthetic users (real auth.users live in Supabase; here we create
  // public.users rows directly so vote FKs resolve in dev).
  const users = Array.from({ length: 25 }, () => ({ id: uuid(), email: null }));
  await prisma.user.createMany({ data: users, skipDuplicates: true });

  // 3. 50 problems
  console.log("  • inserting 50 problems");
  const problemIds: string[] = [];
  for (let i = 0; i < 50; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length]!;
    const titlePool = SAMPLE_TITLES[cat];
    const title = titlePool[i % titlePool.length]!;
    const inst = institutions[i % institutions.length]!;
    // small random offset (~ ±200 m) so the markers don't all overlap
    const jitterLat = (Math.random() - 0.5) * 0.003;
    const jitterLng = (Math.random() - 0.5) * 0.003;

    const problem = await prisma.problem.create({
      data: {
        title,
        description: `Bejelentés a(z) ${inst.name} közeléből. (seed #${i + 1})`,
        latitude: inst.latitude + jitterLat,
        longitude: inst.longitude + jitterLng,
        category: cat,
        status: "open",
        institutionId: i % 3 === 0 ? null : inst.id,
        createdBy: users[i % users.length]!.id,
        score: 0,
      },
      select: { id: true },
    });
    problemIds.push(problem.id);
  }

  // 4. 100 votes
  console.log("  • inserting 100 votes");
  let voteCount = 0;
  while (voteCount < 100) {
    const problemId = problemIds[voteCount % problemIds.length]!;
    const user = users[voteCount % users.length]!;
    const value: 1 | -1 = Math.random() < 0.75 ? 1 : -1;
    try {
      await prisma.vote.create({
        data: { problemId, userId: user.id, value },
      });
      // bump score inline (the voting service will do this transactionally)
      await prisma.problem.update({
        where: { id: problemId },
        data: { score: { increment: value } },
      });
      voteCount++;
    } catch (err) {
      // duplicate (problem, user) — pick another combination
      continue;
    }
  }

  console.log("✅ Seed complete.");
  console.log(`   institutions: ${institutions.length}`);
  console.log(`   problems:     ${problemIds.length}`);
  console.log(`   votes:        ${voteCount}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });