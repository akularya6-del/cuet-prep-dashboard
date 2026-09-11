// Named details retained from the supplied PDFs; spelling follows the source.
export const sourceDetails: Record<string, string> = {
  Matrices:
    "Concept, notation, order, equality, types of matrices, zero matrix, transpose of a matrix, symmetric and skew symmetric matrices. Operations: addition, multiplication and multiplication with a scalar. Simple properties of addition, multiplication and scalar multiplication. Non-commutativity of multiplication and existence of non-zero matrices whose product is the zero matrix (square matrices of order 2). Invertible matrices and proof of uniqueness of inverse, if it exists; all matrices have real entries.",
  Determinants:
    "Determinant of a square matrix up to 3 × 3, minors, cofactors and applications in finding the area of a triangle. Adjoint and inverse of a square matrix. Consistency, inconsistency and number of solutions of systems by examples; solving linear equations in two or three variables having a unique solution using inverse of a matrix.",
  "Continuity and differentiability":
    "Continuity and differentiability, chain rule, derivatives of inverse trigonometric functions sin⁻¹x, cos⁻¹x and tan⁻¹x; implicit functions; concepts of exponential and logarithmic functions and their derivatives; logarithmic differentiation; parametric forms; second-order derivatives.",
  Integrals:
    "Integration as inverse differentiation; substitution, partial fractions and parts. Standard forms: ∫dx/(x²+a²), ∫dx/√(x²±a²), ∫dx/(a²−x²), ∫dx/√(a²−x²), ∫dx/(ax²+bx+c), ∫dx/√(ax²+bx+c), ∫(px+q)dx/(ax²+bx+c), ∫(px+q)dx/√(ax²+bx+c), ∫√(a²±x²)dx, ∫√(x²−a²)dx and ∫√(ax²+bx+c)dx. Fundamental Theorem of Calculus (without proof), basic properties and evaluation of definite integrals. Formula layout is preserved in the original PDF, page 4.",
  "Differential equations":
    "Definition, order and degree; general and particular solutions; separation of variables; homogeneous equations of first order and first degree. Linear equations dy/dx + Py = Q where P and Q are functions of x or constants, and dx/dy + Px = Q where P and Q are functions of y or constants.",
  Vectors:
    "Vectors and scalars, magnitude and direction, direction cosines and direction ratios. Equal, unit, zero, parallel and collinear vectors; position vector, negative vector, components, addition, scalar multiplication and position vector dividing a line segment in a given ratio. Definition, geometrical interpretation, properties and application of scalar (dot) and vector (cross) products.",
  Asanas:
    "Standing: Vrikshasana, Trikonasana, Padhatasana, Utkatsana, Ardhchakrasana. Sitting: Pravatasana, Ustrasana, Yogmudrasana, Simhasana, Dhanurasana, Sukhasana. Lying: Proline—Makarasana, Shalbhasana, Bhujangasana; Supine—Viparita Karani, Sarvangasana. Advance Asana: Kukutasana, Mayurasana. The source's unusual spellings and classification are retained for comparison; this is a syllabus list, not exercise instruction.",
  "Vapour pressure and ideality":
    "Vapour pressure of liquid-liquid solutions, Raoult’s law; vapour pressure of solutions of solids in liquids; Ideal & Non Ideal Solutions; Azeotropes (elementary idea only).",
  "Transition-element trends":
    "Physical properties, atomic & ionic sizes—lanthanoid contraction; ionisation enthalpies; oxidation states; standard electrode potential trends for M²⁺/M and M³⁺/M²⁺; stability of higher oxidation states; chemical reactivity and E° values.",
  "Foundations and nomenclature":
    "General introduction to coordination/complex compounds, Werner’s theory, double salts; coordination entity, central atom/ion, ligands, coordination number, coordination sphere, coordination polyhedron, oxidation number, homoleptic and heteroleptic complexes; IUPAC nomenclature.",
  "Properties and stereochemistry":
    "Physical properties of haloalkanes and haloarenes: melting and boiling point, density and solubility. Chemical properties; optical activity, chirality, retention, inversion and racemization in SN reactions of haloalkanes.",
  "Physical and chemical properties":
    "Boiling point and solubility of alcohols, phenols and ethers; reactions of alcohols involving cleavage of –C–OH and –CO–H bonds; phenol reactions including oxidation and reduction; chemical properties of ethers.",
  Carbohydrates:
    "Classification; preparation and structure of glucose; D & L configuration of monosaccharides; preparation and structure of fructose; disaccharides—sucrose, maltose, lactose; polysaccharides—starch, cellulose, glycogen; importance of carbohydrates.",
};

// B2 is audited and browsable as a separate reference, excluded from Mathematics B1 progress.
export const appliedMathematicsOutline = [
  {
    unit: "I · Numbers, Quantification and Numerical Applications",
    page: 5,
    topics: [
      "Modulo arithmetic",
      "Congruence modulo",
      "Allegation and mixture",
      "Numerical problems",
      "Boats and streams",
      "Pipes and cisterns",
      "Races and games",
      "Numerical inequalities",
    ],
  },
  {
    unit: "II · Algebra",
    page: 6,
    topics: [
      "Matrices and types",
      "Equality, transpose, symmetric and skew symmetric matrices",
      "Algebra of matrices",
      "Determinants",
      "Inverse of a matrix",
      "Simultaneous equations up to three variables (non-homogeneous)",
    ],
  },
  {
    unit: "III · Calculus",
    page: 7,
    topics: [
      "Higher-order derivatives (up to second order)",
      "Applications of derivatives",
      "Marginal cost and revenue",
      "Increasing/decreasing functions",
      "Maxima and minima",
      "Integration",
      "Indefinite integrals as family of curves",
      "Definite integral as area under a curve",
      "Consumer and producer surplus",
      "Differential equations",
      "Formulating and solving differential equations",
    ],
  },
  {
    unit: "IV · Probability Distributions",
    page: 8,
    topics: [
      "Random variables and distributions",
      "Mathematical expectation",
      "Variance and standard deviation",
      "Binomial distribution",
      "Poisson distribution",
      "Normal distribution",
    ],
  },
  {
    unit: "V · Time Based Data",
    page: 8,
    topics: [
      "Time series",
      "Components",
      "Univariate time series analysis",
      "Secular trend",
      "Methods of measuring trend",
    ],
  },
  {
    unit: "VI · Inferential Statistics",
    page: 9,
    topics: [
      "Population and sample; representative, simple random and systematic samples",
      "Parameter, statistic, significance, inferences and Central Limit Theorem",
      "One-sample t-test; null/alternate hypothesis and degrees of freedom",
    ],
  },
  {
    unit: "VII · Financial Mathematics",
    page: 9,
    topics: [
      "Perpetuity and sinking funds",
      "EMI",
      "Returns and nominal rate of return",
      "Compound annual growth rate",
      "Linear depreciation",
      "Valuation of bonds by present value",
    ],
  },
  {
    unit: "VIII · Linear Programming",
    page: 10,
    topics: [
      "Terminology",
      "Mathematical formulation",
      "Types of problems",
      "Graphical solution in two variables",
      "Feasible and infeasible regions",
      "Feasible/infeasible and optimal solutions",
    ],
  },
];
