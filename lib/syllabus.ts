import type { SubjectId, SyllabusSubject, SyllabusTopic } from "./types";
import { sourceDetails } from "./source-details";

type TopicSeed = [
  unit: string,
  title: string,
  officialWording: string,
  sourcePage: number,
  rawWeight?: number,
];

const sourceFiles: Record<SubjectId, string> = {
  mathematics: "202512271521179041.pdf",
  chemistry: "20251227437950608.pdf",
  english: "20251227980877010.pdf",
  "physical-education": "202512271937553070.pdf",
  gat: "20251227140287889.pdf",
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const scopeWeight = (wording: string) =>
  Math.max(1, Math.min(5, Math.ceil(wording.split(/\s+/).length / 14)));

function topics(subjectId: SubjectId, seeds: TopicSeed[]): SyllabusTopic[] {
  return seeds.map(
    ([unit, title, officialWording, sourcePage, rawWeight], order) => {
      officialWording = sourceDetails[title] ?? officialWording;
      const unitId = `${subjectId}:${slug(unit)}`;
      return {
        id: `${unitId}:${slug(title)}`,
        subjectId,
        unitId,
        unit,
        title,
        officialWording,
        parentId: unitId,
        order,
        rawWeight: rawWeight ?? scopeWeight(officialWording),
        sourceFile: sourceFiles[subjectId],
        sourcePage,
      };
    },
  );
}

const mathematics = topics("mathematics", [
  [
    "Unit I · Relations and Functions",
    "Relations and functions",
    "Types of relations: reflexive, symmetric, transitive and equivalence relations. One-to-one and onto functions.",
    3,
  ],
  [
    "Unit I · Relations and Functions",
    "Inverse trigonometric functions",
    "Definition, range, domain and principal value branches. Graphs of inverse trigonometric functions.",
    3,
  ],
  [
    "Unit II · Algebra",
    "Matrices",
    "Concept, notation, order, equality and types of matrices; zero, transpose, symmetric and skew-symmetric matrices; operations, properties, non-commutativity and invertible matrices.",
    3,
  ],
  [
    "Unit II · Algebra",
    "Determinants",
    "Determinants up to 3 × 3, minors, cofactors, triangle area, adjoint and inverse; consistency and solution of linear systems using the inverse matrix.",
    3,
  ],
  [
    "Unit III · Calculus",
    "Continuity and differentiability",
    "Continuity and differentiability, chain rule, inverse trigonometric, implicit, exponential and logarithmic derivatives, parametric forms and second-order derivatives.",
    3,
  ],
  [
    "Unit III · Calculus",
    "Applications of derivatives",
    "Rate of change, increasing and decreasing functions, maxima and minima by first and second derivative tests, including simple real-life problems.",
    3,
  ],
  [
    "Unit III · Calculus",
    "Integrals",
    "Integration as inverse differentiation; substitution, partial fractions and integration by parts; standard forms, the Fundamental Theorem of Calculus and properties of definite integrals.",
    4,
  ],
  [
    "Unit III · Calculus",
    "Applications of integrals",
    "Area under simple curves, especially lines, circles, parabolas and ellipses in standard form.",
    4,
  ],
  [
    "Unit III · Calculus",
    "Differential equations",
    "Definition, order, degree, general and particular solutions; separation of variables, homogeneous first-order equations and linear differential equations.",
    4,
  ],
  [
    "Unit IV · Vectors and Three-dimensional Geometry",
    "Vectors",
    "Vectors and scalars, magnitude, direction cosines and ratios, vector types, components and section formula; scalar and vector products with applications.",
    5,
  ],
  [
    "Unit IV · Vectors and Three-dimensional Geometry",
    "Three-dimensional geometry",
    "Direction cosines and ratios of a line; Cartesian and vector equations, skew lines, shortest distance and angle between two lines.",
    5,
  ],
  [
    "Unit V · Linear Programming",
    "Linear programming",
    "Constraints, objective function, optimization, graphical solutions in two variables, bounded and unbounded feasible regions, and optimal feasible solutions up to three constraints.",
    5,
  ],
  [
    "Unit VI · Probability",
    "Probability",
    "Simple Probability (Section A1, page 2). Conditional probability, multiplication theorem, independent events, total probability and Bayes' theorem (Section B1).",
    5,
  ],
]);

const chemistry = topics("chemistry", [
  [
    "Unit I · Solutions",
    "Types and concentration of solutions",
    "Introduction to solutions and their types; expressing concentration; solubility of solids and gases in liquids; Henry's law.",
    2,
  ],
  [
    "Unit I · Solutions",
    "Vapour pressure and ideality",
    "Vapour pressure of liquid-liquid and solid-liquid solutions; Raoult's law; ideal and non-ideal solutions; azeotropes.",
    2,
  ],
  [
    "Unit I · Solutions",
    "Colligative properties",
    "Relative lowering of vapour pressure, elevation of boiling point, depression of freezing point, osmosis, osmotic pressure, reverse osmosis and water purification.",
    2,
  ],
  [
    "Unit I · Solutions",
    "Molar mass and van't Hoff factor",
    "Determination of molar mass, abnormal molar masses and van't Hoff factor.",
    2,
  ],
  [
    "Unit II · Electrochemistry",
    "Electrochemical cells",
    "Electrochemical and galvanic cells, standard electrode potential, EMF, Nernst equation and applications, Gibbs energy and equilibrium constant.",
    2,
  ],
  [
    "Unit II · Electrochemistry",
    "Conductance",
    "Conductance of electrolytic solutions; measurement of conductivity; specific and molar conductivity; concentration variation; Kohlrausch law and applications.",
    2,
  ],
  [
    "Unit II · Electrochemistry",
    "Electrolysis",
    "Electrolytic cells, electrolysis, Faraday's laws and products of electrolysis.",
    2,
  ],
  [
    "Unit II · Electrochemistry",
    "Batteries, fuel cells and corrosion",
    "Primary and secondary batteries, fuel cells and corrosion.",
    2,
  ],
  [
    "Unit III · Chemical Kinetics",
    "Reaction rates and rate law",
    "Average and instantaneous rates; effects of concentration, temperature and catalyst; rate law, rate constant, order and molecularity.",
    2,
  ],
  [
    "Unit III · Chemical Kinetics",
    "Integrated rate equations",
    "Integrated rate equations and half-life for zero and first-order reactions; pseudo-first-order reactions.",
    2,
  ],
  [
    "Unit III · Chemical Kinetics",
    "Arrhenius and collision theory",
    "Arrhenius equation, activation energy, collision theory for bimolecular elementary reactions and its limitations.",
    2,
  ],
  [
    "Unit IV · d and f Block Elements",
    "Position and electronic configuration",
    "Position and electronic configurations of d- and f-block elements.",
    2,
  ],
  [
    "Unit IV · d and f Block Elements",
    "Transition-element trends",
    "Physical properties, atomic and ionic sizes, lanthanoid contraction, ionisation enthalpies, oxidation states and electrode-potential trends.",
    2,
  ],
  [
    "Unit IV · d and f Block Elements",
    "Transition-element chemistry",
    "Higher oxidation states, chemical reactivity, magnetic and coloured ions, complex formation, catalysis, interstitial compounds, alloys, oxides and oxoanions.",
    2,
  ],
  [
    "Unit IV · d and f Block Elements",
    "Important compounds and f-block",
    "K₂Cr₂O₇ and KMnO₄; lanthanoids and actinoids, sizes, oxidation states, comparison and applications of d- and f-block elements.",
    2,
  ],
  [
    "Unit V · Coordination Compounds",
    "Foundations and nomenclature",
    "Werner's theory, double salts, coordination terminology, homoleptic and heteroleptic complexes, and IUPAC nomenclature.",
    3,
  ],
  [
    "Unit V · Coordination Compounds",
    "Isomerism and bonding",
    "Isomerism; valence bond theory and limitations; crystal field theory, magnetic properties, colour, limitations and spectrochemical series.",
    3,
  ],
  [
    "Unit V · Coordination Compounds",
    "Metal carbonyls and applications",
    "Shape and bonding in metal carbonyls; importance and applications of coordination compounds.",
    3,
  ],
  [
    "Unit VI · Haloalkanes and Haloarenes",
    "Classification and preparation",
    "Introduction, classification, nomenclature, nature of the C-X bond, and methods of preparation of haloalkanes and haloarenes.",
    3,
  ],
  [
    "Unit VI · Haloalkanes and Haloarenes",
    "Properties and stereochemistry",
    "Physical and chemical properties; optical activity, chirality, retention, inversion and racemization in substitution reactions.",
    3,
  ],
  [
    "Unit VI · Haloalkanes and Haloarenes",
    "Polyhalogen compounds",
    "Important polyhalogen compounds: CH₂Cl₂, CHCl₃, CHI₃, CCl₄, freons and DDT.",
    3,
  ],
  [
    "Unit VII · Alcohols, Phenols and Ethers",
    "Structure, classification and preparation",
    "Classification, nomenclature and structures of alcohol, phenol and ether functional groups; methods of preparation.",
    3,
  ],
  [
    "Unit VII · Alcohols, Phenols and Ethers",
    "Physical and chemical properties",
    "Boiling point and solubility; chemical properties of alcohols, phenols and ethers, including cleavage, oxidation and reduction.",
    3,
  ],
  [
    "Unit VII · Alcohols, Phenols and Ethers",
    "Commercial alcohols",
    "Commercially important alcohols including methanol and ethanol.",
    3,
  ],
  [
    "Unit VIII · Aldehydes, Ketones and Carboxylic Acids",
    "Carbonyl compounds",
    "Introduction, nomenclature, carbonyl structure, preparation, physical and chemical properties, and uses of aldehydes and ketones.",
    3,
  ],
  [
    "Unit VIII · Aldehydes, Ketones and Carboxylic Acids",
    "Carboxylic acids",
    "Carboxyl-group structure, preparation, boiling point and solubility, chemical properties and uses of carboxylic acids.",
    3,
  ],
  [
    "Unit IX · Amines",
    "Amines",
    "Structure, classification, nomenclature, preparation, physical properties, basic character and chemical properties of amines.",
    4,
  ],
  [
    "Unit IX · Amines",
    "Diazonium salts",
    "Preparation and physical and chemical properties of aliphatic and aromatic diazonium salts; importance in aromatic synthesis.",
    4,
  ],
  [
    "Unit X · Biomolecules",
    "Carbohydrates",
    "Classification, glucose and fructose preparation and structure, D/L configuration, disaccharides, polysaccharides and biological importance.",
    4,
  ],
  [
    "Unit X · Biomolecules",
    "Amino acids, proteins and enzymes",
    "Amino-acid classification; protein structure and types; denaturation; enzymes and elementary mechanism of enzyme action.",
    4,
  ],
  [
    "Unit X · Biomolecules",
    "Vitamins, nucleic acids and hormones",
    "Vitamin types, sources and deficiency diseases; nucleic-acid types, composition, structure and importance; hormone classification, importance and deficiency diseases.",
    4,
  ],
]);

const english = topics("english", [
  [
    "1 · Reading Comprehension",
    "Factual passages",
    "Reading comprehension based on factual passages of a maximum of 300 words.",
    2,
  ],
  [
    "1 · Reading Comprehension",
    "Narrative passages",
    "Reading comprehension based on narrative passages of a maximum of 300 words.",
    2,
  ],
  [
    "1 · Reading Comprehension",
    "Literary passages",
    "Reading comprehension based on literary passages of a maximum of 300 words.",
    2,
  ],
  ["2 · Verbal Ability", "Rearranging the parts", "Rearranging the parts.", 2],
  ["2 · Verbal Ability", "Match the following", "Match the following.", 2],
  [
    "2 · Verbal Ability",
    "Choosing the correct word",
    "Choosing the correct word.",
    2,
  ],
  ["2 · Verbal Ability", "Synonyms and antonyms", "Synonyms and antonyms.", 2],
]);

const physicalEducation = topics("physical-education", [
  [
    "Unit I · Health Status and Programmes in India",
    "National health policy and programmes",
    "National Health Policies; National Rural Health Mission (NRHM); School Health Services and Midday Meal Programme; Adolescence Education Programme.",
    2,
  ],
  [
    "Unit I · Health Status and Programmes in India",
    "Nutritional status",
    "Hypo-nutrition and hyper-nutrition.",
    2,
  ],
  [
    "Unit I · Health Status and Programmes in India",
    "Inclusive physical education",
    "Advantages of physical activities and strategies to make them accessible for children with special needs.",
    2,
  ],
  [
    "Unit I · Health Status and Programmes in India",
    "Communicable diseases",
    "Typhoid, influenza, malaria, dengue and HIV infection.",
    2,
  ],
  [
    "Unit I · Health Status and Programmes in India",
    "Non-communicable diseases",
    "Diabetes, hypertension, obesity and arthritis.",
    2,
  ],
  [
    "Unit II · Psychological and Sociological Aspects",
    "Sports psychology",
    "Role of psychology in games and sports; motivation, its types and techniques in sports.",
    2,
  ],
  [
    "Unit II · Psychological and Sociological Aspects",
    "Personality",
    "Theories of personality: C. G. Jung, Sheldon and Big Five Factor Theory.",
    2,
  ],
  [
    "Unit II · Psychological and Sociological Aspects",
    "Emotion, anxiety and aggression",
    "Role of sports in managing emotion, anxiety and aggression.",
    2,
  ],
  [
    "Unit II · Psychological and Sociological Aspects",
    "Leadership and national integration",
    "Development of leadership qualities through games and sports; role of physical education in promoting national integration.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Athletics",
    "Athletics: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Badminton",
    "Badminton: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Basketball",
    "Basketball: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Cricket",
    "Cricket: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Football",
    "Football: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Gymnastics",
    "Gymnastics: arena specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Handball",
    "Handball: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Hockey",
    "Hockey: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Judo",
    "Judo: arena specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Kabaddi",
    "Kabaddi: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Kho-kho",
    "Kho-kho: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Volleyball",
    "Volleyball: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Swimming",
    "Swimming: arena specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Table tennis",
    "Table tennis: play-field specifications, general rules and fundamental skills.",
    2,
  ],
  [
    "Unit III · Games, Sports and Yogic Practice",
    "Wrestling",
    "Wrestling: arena specifications, general rules and fundamental skills.",
    2,
  ],
  ["Unit IV · Yoga", "Surya Namaskar", "Suryanamaskar / Sun Salutation.", 3],
  [
    "Unit IV · Yoga",
    "Asanas",
    "Standing, sitting, prone, supine and advanced asanas listed in the official syllabus.",
    3,
  ],
  [
    "Unit IV · Yoga",
    "Kriya, bandha and pranayama",
    "Kapalbhati, Tratak, Neti and Dhauti; Uddiyana and Jalandhar Bandha; Bhramari, Sheetali, Ujjayi and Nadi Shodhana.",
    3,
  ],
  [
    "Unit IV · Yoga",
    "Yog Nidra and safe practice",
    "Yog Nidra and knowledge of the do's and don'ts of yogic practices.",
    3,
  ],
  [
    "Unit V · Nutrition and Athlete's Care",
    "Nutrition and sports diet",
    "Macro and micro nutrients, balanced diet, and the importance of diet before, during and after competition.",
    3,
  ],
  [
    "Unit V · Nutrition and Athlete's Care",
    "Food adulteration",
    "Food adulteration and awareness.",
    3,
  ],
  [
    "Unit V · Nutrition and Athlete's Care",
    "Postural deformities",
    "Postural deformities and their corrective measures.",
    3,
  ],
  [
    "Unit V · Nutrition and Athlete's Care",
    "Sports injuries",
    "Causes and management of sprain, strain, contusion, abrasion, dislocation and oblique, impacted, comminuted, transverse and greenstick fractures.",
    3,
  ],
  [
    "Unit VI · Policies, Programmes and Careers",
    "Sports policy and awards",
    "National Sports Policies; Major Dhyan Chand Khel Ratna, Arjuna and Dronacharya awards.",
    3,
  ],
  [
    "Unit VI · Policies, Programmes and Careers",
    "Careers and courses",
    "Career opportunities and courses in Physical Education, Sports and Yoga in India.",
    3,
  ],
  [
    "Unit VII · Skill-related Physical Fitness",
    "Strength",
    "Strength: isometric, isotonic and isokinetic exercises.",
    4,
  ],
  [
    "Unit VII · Skill-related Physical Fitness",
    "Endurance",
    "Continuous, interval and Fartlek training methods.",
    4,
  ],
  [
    "Unit VII · Skill-related Physical Fitness",
    "Speed and flexibility",
    "Acceleration and pace runs; ballistic method and proprioceptive neuromuscular facilitation (PNF).",
    4,
  ],
  [
    "Unit VIII · Measurement and Evaluation",
    "Strength, speed and agility tests",
    "Standing Broad Jump, Backward Medicine Ball Throw, 50-metre sprint, Shuttle Run (4×10 metres) and SEMO Agility Test.",
    4,
  ],
  [
    "Unit VIII · Measurement and Evaluation",
    "Balance and senior fitness",
    "Static Balance (Flamingo), Dynamic Balance (Modified Bass), and Rikli & Jones Senior Citizen Fitness Test.",
    4,
  ],
  [
    "Unit IX · Physiology and Biomechanics",
    "Physiological factors and exercise effects",
    "Physiological factors determining physical-fitness components; effects of exercise on muscular and cardio-respiratory systems.",
    4,
  ],
  [
    "Unit IX · Physiology and Biomechanics",
    "Laws of motion and levers",
    "Newton's laws of motion and types of levers with their applications in sports.",
    4,
  ],
]);

const gat = topics("gat", [
  ["General Test · 501", "General knowledge", "General Knowledge.", 2],
  ["General Test · 501", "Current affairs", "Current Affairs.", 2],
  [
    "General Test · 501",
    "General mental ability",
    "General Mental Ability.",
    2,
  ],
  ["General Test · 501", "Numerical ability", "Numerical Ability.", 2],
  [
    "General Test · 501",
    "Quantitative reasoning",
    "Reasoning through simple applications of basic mathematical concepts: quantitative arithmetic, algebra, geometry, mensuration and statistics.",
    2,
  ],
  ["General Test · 501", "Logical reasoning", "Logical Reasoning.", 2],
  ["General Test · 501", "Analytical reasoning", "Analytical Reasoning.", 2],
  ["General Test · 501", "General science", "General Science.", 2],
  ["General Test · 501", "Environment literacy", "Environment Literacy.", 2],
]);

export const syllabus: SyllabusSubject[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    shortName: "Maths",
    code: "319",
    color: "#6ea8fe",
    sourceFile: sourceFiles.mathematics,
    structureNote:
      "Section A1 common core is consolidated with the more detailed Section B1 Mathematics units to avoid double-counting. Section B2 is the separate Applied Mathematics pathway and is not included in this Mathematics dashboard.",
    topics: mathematics,
  },
  {
    id: "chemistry",
    name: "Chemistry",
    shortName: "Chemistry",
    code: "306",
    color: "#59d6b1",
    sourceFile: sourceFiles.chemistry,
    structureNote:
      "Ten official units, split into study-sized topics without changing the official unit order.",
    topics: chemistry,
  },
  {
    id: "english",
    name: "English",
    shortName: "English",
    code: "101",
    color: "#e9b96e",
    sourceFile: sourceFiles.english,
    structureNote:
      "The source says topics are not limited to this list; the dashboard represents every topic explicitly named in the PDF.",
    topics: english,
  },
  {
    id: "physical-education",
    name: "Physical Education",
    shortName: "Physical Ed.",
    code: "321",
    color: "#ef8175",
    sourceFile: sourceFiles["physical-education"],
    structureNote:
      "Nine official units. Unit III's three shared competencies are attached to each named sport so progress can be logged per sport.",
    topics: physicalEducation,
  },
  {
    id: "gat",
    name: "General Aptitude Test",
    shortName: "GAT",
    code: "501",
    color: "#bd8ff5",
    sourceFile: sourceFiles.gat,
    structureNote:
      "The PDF is a flat list; closely coupled compound bullets are separated only where they represent distinct study areas.",
    topics: gat,
  },
];

export const allTopics = syllabus.flatMap((subject) => subject.topics);
export const topicById = new Map(allTopics.map((topic) => [topic.id, topic]));
export const subjectById = new Map(
  syllabus.map((subject) => [subject.id, subject]),
);

export function normalizedTopicWeight(topic: SyllabusTopic): number {
  const total =
    subjectById
      .get(topic.subjectId)
      ?.topics.reduce((sum, item) => sum + item.rawWeight, 0) ?? 1;
  return topic.rawWeight / total;
}

export function validateSyllabus(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const subject of syllabus) {
    if (!subject.topics.length) errors.push(`${subject.name} has no topics`);
    for (const topic of subject.topics) {
      if (ids.has(topic.id)) errors.push(`Duplicate topic ID: ${topic.id}`);
      ids.add(topic.id);
      if (topic.parentId !== topic.unitId)
        errors.push(`Invalid parent for ${topic.id}`);
      if (topic.rawWeight <= 0) errors.push(`Invalid weight for ${topic.id}`);
    }
    const total = subject.topics.reduce(
      (sum, topic) => sum + normalizedTopicWeight(topic),
      0,
    );
    if (Math.abs(total - 1) > 1e-10)
      errors.push(`${subject.name} weights total ${total}`);
  }
  return errors;
}
