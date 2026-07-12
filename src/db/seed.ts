import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { boards, shops, items, users } from "./schema";

type BoardSpec = {
  name: string;
  slug: string;
  description?: string;
  kind?: "board" | "article" | "class";
  extraArticleJob?: "writer" | "field_agent" | "chief_editor";
  restrictedToHall?: "undercroft" | "veil" | "rampart" | "eaves";
};

const CATEGORIES: { name: string; slug: string; boards: BoardSpec[] }[] = [
  {
    name: "Dormitories",
    slug: "dormitories",
    boards: [
      {
        name: "Undercroft Hall",
        slug: "undercroft-hall",
        kind: "article",
        extraArticleJob: "field_agent",
        restrictedToHall: "undercroft",
      },
      {
        name: "Veil Hall",
        slug: "veil-hall",
        kind: "article",
        extraArticleJob: "field_agent",
        restrictedToHall: "veil",
      },
      {
        name: "Rampart Hall",
        slug: "rampart-hall",
        kind: "article",
        extraArticleJob: "field_agent",
        restrictedToHall: "rampart",
      },
      {
        name: "Eaves Hall",
        slug: "eaves-hall",
        kind: "article",
        extraArticleJob: "field_agent",
        restrictedToHall: "eaves",
      },
      { name: "Dormitories", slug: "dormitories-board" },
      { name: "Student Commons", slug: "student-commons" },
      { name: "Notice Board", slug: "notice-board", kind: "article" },
      { name: "Community Board", slug: "community-board", kind: "article" },
    ],
  },
  {
    name: "First Floor",
    slug: "first-floor",
    boards: [
      { name: "Main Foyer", slug: "main-foyer" },
      { name: "Dining Hall", slug: "dining-hall" },
      { name: "Grand Ballroom", slug: "grand-ballroom" },
      { name: "Food Court", slug: "food-court" },
      { name: "Auditorium", slug: "auditorium" },
      { name: "Pool/Gym/Spa", slug: "pool-gym-spa" },
      { name: "Physical Education", slug: "physical-education", kind: "class" },
      { name: "Armistead Weekly", slug: "armistead-weekly", kind: "article", extraArticleJob: "chief_editor" },
      { name: "Inside Ploy", slug: "inside-ploy", kind: "article", extraArticleJob: "chief_editor" },
    ],
  },
  {
    name: "Second Floor",
    slug: "second-floor",
    boards: [
      { name: "Science Labs", slug: "science-labs" },
      { name: "Computer Labs", slug: "computer-labs" },
      { name: "Library", slug: "library" },
      { name: "Offices", slug: "offices" },
      { name: "Music Room", slug: "music-room" },
    ],
  },
  {
    name: "Third Floor",
    slug: "third-floor",
    boards: [
      { name: "Roof Top", slug: "roof-top" },
      { name: "Portrait Hall", slug: "portrait-hall" },
      { name: "Classrooms", slug: "classrooms" },
      { name: "Armory", slug: "armory" },
    ],
  },
  {
    name: "Grounds",
    slug: "grounds",
    boards: [
      { name: "Grounds", slug: "grounds-board" },
      { name: "Grounds Commons", slug: "grounds-commons" },
      { name: "Driving Track", slug: "driving-track" },
      { name: "Winifred Garden", slug: "winifred-garden" },
      { name: "Boathouse/Lake", slug: "boathouse-lake" },
      { name: "Bell Tower", slug: "bell-tower" },
      { name: "Spymaster Tower", slug: "spymaster-tower" },
    ],
  },
  {
    name: "Underground",
    slug: "underground",
    boards: [
      { name: "Basement Level", slug: "basement-level" },
      { name: "Medical Bay", slug: "medical-bay" },
      { name: "Garage", slug: "garage" },
      { name: "Shooting Range", slug: "shooting-range" },
    ],
  },
  {
    name: "Outside Armistead",
    slug: "outside-armistead",
    boards: [
      { name: "Willowbrook", slug: "willowbrook" },
      { name: "Sennecouche Woods", slug: "sennecouche-woods" },
      { name: "Abandoned Mill", slug: "abandoned-mill" },
      { name: "The Past", slug: "the-past" },
      { name: "Missions", slug: "missions" },
      { name: "Elsewhere", slug: "elsewhere" },
    ],
  },
  {
    name: "Communications",
    slug: "communications",
    boards: [
      { name: "Text Messages", slug: "text-messages" },
      { name: "Social Media", slug: "social-media" },
      { name: "Emails/Letters", slug: "emails-letters" },
      { name: "Phone Calls", slug: "phone-calls" },
    ],
  },
];

async function main() {
  console.log("Seeding an admin account...");
  const passwordHash = await bcrypt.hash("changeme123", 10);
  await db
    .insert(users)
    .values({
      email: "admin@armistead.local",
      passwordHash,
      isAdmin: true,
    })
    .onConflictDoNothing();
  console.log('  -> login: "admin@armistead.local" / "changeme123" (change this password after first login)');

  console.log("Seeding boards...");

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i];
    const [category] = await db
      .insert(boards)
      .values({ kind: "category", name: cat.name, slug: cat.slug, position: i })
      .returning();

    await db.insert(boards).values(
      cat.boards.map((b, j) => ({
        kind: b.kind ?? ("board" as const),
        parentId: category.id,
        name: b.name,
        slug: b.slug,
        description: b.description,
        extraArticleJob: b.extraArticleJob,
        restrictedToHall: b.restrictedToHall,
        position: j,
      }))
    );
  }

  // "Training" category — the real class list.
  const [trainingCategory] = await db
    .insert(boards)
    .values({ kind: "category", name: "Training", slug: "training", position: CATEGORIES.length })
    .returning();

  const CLASSES: BoardSpec[] = [
    { name: "General Education", slug: "general-education" },
    { name: "Threat Elimination", slug: "threat-elimination" },
    { name: "Precise Shooting", slug: "precise-shooting" },
    { name: "Covert & Team Operations", slug: "covert-team-operations" },
    { name: "Linguistics, Culture, & Assimilation", slug: "linguistics-culture-assimilation" },
    { name: "Disguise and Identity Management", slug: "disguise-identity-management" },
    { name: "Advanced Encryption", slug: "advanced-encryption" },
    { name: "Survival and Navigation", slug: "survival-navigation" },
    { name: "Communication and Relay", slug: "communication-relay" },
    { name: "Drivers Ed", slug: "drivers-ed" },
    { name: "Research and Development", slug: "research-development" },
    { name: "Medical Training", slug: "medical-training" },
    { name: "Chemistry and Criminology", slug: "chemistry-criminology" },
    { name: "Seduction and Influence/Manipulation Tactics", slug: "seduction-influence-tactics" },
    { name: "Interrogation", slug: "interrogation" },
    { name: "Protection and Enforcement", slug: "protection-enforcement" },
    { name: "Poison", slug: "poison" },
    { name: "Weapon Handling", slug: "weapon-handling" },
  ];

  await db.insert(boards).values(
    CLASSES.map((c, i) => ({
      kind: "class" as const,
      parentId: trainingCategory.id,
      name: c.name,
      slug: c.slug,
      position: i,
    }))
  );

  console.log("Seeding a starter shop...");
  const [generalStore] = await db
    .insert(shops)
    .values({
      name: "The General Store",
      slug: "general-store",
      description: "Everyday supplies and oddities.",
    })
    .returning();

  await db.insert(items).values([
    { shopId: generalStore.id, name: "Field Notebook", price: 8, stock: null },
    { shopId: generalStore.id, name: "Coffee", price: 3, stock: null },
    { shopId: generalStore.id, name: "Second-hand Field Manual", price: 15, stock: 20 },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
