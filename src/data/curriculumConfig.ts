import {
  AssessmentItem,
  CtlActivityConfig,
  CtlChallengeOption,
  GlossaryItem,
  LevelConfig,
  Mission,
  OperationModuleConfig,
  TopicConfig,
} from '../types/algebra';

/**
 * ALGEBRA QUEST LEARNING CONTENT CONFIGURATION
 * Structured pathway across Algebra Foundations, Story Missions 1-4,
 * the Operation Lab (addition, subtraction, distributive multiplication, non-zero division),
 * and formative/summative quizzes.
 */
export const CURRICULUM_META = {
  versionLabel: 'Interactive Algebra Tiles & Guided Learning Pathway',
  note: 'Core missions progress from Algebra Foundations through Story Missions 1–4 and the Operation Lab, supported by concept checks, quizzes, and student reflections.',
};

export interface LearningPathwayRow {
  id: string;
  pathway: string;
  contentSummary: string;
  statusLabel: 'Foundation' | 'Core' | 'Advanced';
  targetTab: 'academy' | 'story' | 'oplab' | 'assessment';
}

export const LEARNING_PATHWAY_MAP: LearningPathwayRow[] = [
  {
    id: 'map-fondasi',
    pathway: 'Algebra Foundations',
    contentSummary: 'Variables, coefficients, constants, terms, algebraic expressions, and x², x, and 1 tiles.',
    statusLabel: 'Foundation',
    targetTab: 'academy',
  },
  {
    id: 'map-ctl-1',
    pathway: 'Mission 1 — The Stationery Shop',
    contentSummary: 'Shopping models: expressions x + 2, x + 2 + 1 = x + 3, and 2(x + 3).',
    statusLabel: 'Core',
    targetTab: 'story',
  },
  {
    id: 'map-ctl-2',
    pathway: 'Mission 2 — Exploring Algebraic Properties',
    contentSummary: 'Commutative x + 3 vs 3 + x; associative (x + 2) + 1 vs x + (2 + 1).',
    statusLabel: 'Core',
    targetTab: 'story',
  },
  {
    id: 'map-ctl-3',
    pathway: 'Mission 3 — Building Two Equal Groups',
    contentSummary: 'Two bundles: 2(x + 3) = 2x + 6; substitution check with x = 4.',
    statusLabel: 'Core',
    targetTab: 'story',
  },
  {
    id: 'map-ctl-4',
    pathway: 'Mission 4 — Equivalent Expressions Challenge',
    contentSummary: 'Equivalent expression challenge A, B, or C with tile models and group reasoning.',
    statusLabel: 'Core',
    targetTab: 'story',
  },
  {
    id: 'map-oplab',
    pathway: 'Operation Lab',
    contentSummary: 'Addition, subtraction, scalar-by-group multiplication, and non-zero division.',
    statusLabel: 'Advanced',
    targetTab: 'oplab',
  },
  {
    id: 'map-eval',
    pathway: 'Quiz & Assessment',
    contentSummary: 'Core Concept Check, topic quizzes, worked explanations, score summary, and reflection.',
    statusLabel: 'Core',
    targetTab: 'assessment',
  },
];

export const LEVELS_CONFIG: LevelConfig[] = [
  {
    id: 'level-1',
    number: '01',
    title: 'Algebra Foundations & The Stationery Shop',
    shortTitle: 'Foundations',
    pathway: 'fondasi',
    description:
      'Explore variables, coefficients, constants, and terms with x², x, and 1 tiles, and build expressions from a stationery shopping scenario.',
    learningObjectives: [
      'Distinguish variables, coefficients, constants, and terms using x², x, and 1 tiles.',
      'Build expressions x + 2, x + 3, and 2(x + 3) from a shopping scenario.',
    ],
    color: '#27A89A',
  },
  {
    id: 'level-2',
    number: '02',
    title: 'Like Terms, Commutative & Associative Properties',
    shortTitle: 'Properties & Terms',
    pathway: 'ctl_inti',
    description:
      'Group like terms and investigate the commutative and associative properties by observing what changes and what stays invariant.',
    learningObjectives: [
      'Combine like terms such as 2x + 3x = 5x and explain why 2x + 3 stays uncombined.',
      'Investigate x + 3 = 3 + x and (x + 2) + 1 = x + (2 + 1) using Algebra Tiles.',
    ],
    color: '#3A86D8',
    prerequisiteLevelId: 'level-1',
  },
  {
    id: 'level-3',
    number: '03',
    title: 'Distributive Property, Equivalence & Zero Pairs',
    shortTitle: 'Distributive & Zero Pairs',
    pathway: 'ctl_inti',
    description:
      'Discover why 2(x + 3) = 2x + 6 using equal groups, verify equivalence at x = 4, and simplify zero pairs (+ and −).',
    learningObjectives: [
      'Explain the distributive property through repeated groups and substitution at x = 4.',
      'Pair and cancel zero pairs (+x with −x, +1 with −1).',
    ],
    color: '#EF8748',
    prerequisiteLevelId: 'level-2',
  },
  {
    id: 'level-4',
    number: '04',
    title: 'Algebraic Operations & Equation Balance',
    shortTitle: 'Operations & Equations',
    pathway: 'operation_lab',
    description:
      'Master addition, subtraction, scalar multiplication, non-zero division, and balanced steps to solve linear equations.',
    learningObjectives: [
      'Perform addition, subtraction, k(x + a) multiplication, and division by a non-zero number.',
      'Maintain equality on both sides of the Equation Balance board to isolate the variable.',
    ],
    color: '#5943A8',
    prerequisiteLevelId: 'level-3',
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Variable (x, x²)',
    definition:
      'A letter symbol representing an unknown or varying number—for example, the price of one notebook = x.',
    example: 'In x + 2, the letter x represents the price of 1 notebook.',
  },
  {
    term: 'Coefficient',
    definition:
      'The number multiplying a variable, showing how many like variable tiles are present.',
    example: 'In 5x, the number 5 is the coefficient (5 tiles of +x).',
  },
  {
    term: 'Constant (1, −1)',
    definition:
      'A fixed numerical term with no variable, represented by small unit square tiles (+1 or −1).',
    example: 'In 2x + 6, the number 6 is the constant term.',
  },
  {
    term: 'Terms & Like Terms',
    definition:
      'Parts of an expression separated by + or − signs. Like terms share the exact same variable and exponent so they can be combined.',
    example: '3x and 2x are like terms (3x + 2x = 5x), whereas 2x and 3 are unlike terms.',
  },
  {
    term: 'Commutative, Associative & Distributive Properties',
    definition:
      'Commutative swaps addition order (x + 3 = 3 + x); associative changes grouping ((x + 2) + 1 = x + (2 + 1)); distributive expands repeated groups (2(x + 3) = 2x + 6).',
    example: '2 bundles each containing (x + 3) equal 2x + 6.',
  },
  {
    term: 'Zero Pair',
    definition:
      'A pair of tiles of the same term type with opposite signs (+ and −) whose combined value equals 0.',
    example: '+x + (−x) = 0 and +1 + (−1) = 0.',
  },
  {
    term: 'Equivalent Expressions & Substitution',
    definition:
      'Two algebraic expressions that look different in arrangement but evaluate to the exact same value for every input (such as x = 4).',
    example: 'At x = 4: 2(4 + 3) = 14 and 2(4) + 6 = 14.',
  },
  {
    term: 'Equation Balance',
    definition:
      'The principle that both sides of the equals sign (=) must receive identical operations to remain balanced.',
    example: 'For x + 3 = 5, add −3 to both sides to find x = 2.',
  },
];

export const CTL_ACTIVITIES_CONFIG: CtlActivityConfig[] = [
  {
    id: 'ctl-activity-1',
    order: 1,
    title: 'Mission 1 — The Stationery Shop',
    subtitle: 'Building algebraic expressions from a real-world shopping problem',
    ctlPillars: ['Explore', 'Model', 'Reason'],
    contextStory:
      'At the school shop, the price of 1 notebook is unknown, so we represent it as x. One pencil costs 2 units (two +1 tiles), and one eraser costs 1 unit (one +1 tile).',
    taskSummary:
      'Build three shopping models step by step: (1) 1 notebook and 1 pencil → x + 2; (2) add 1 eraser → x + 2 + 1 = x + 3; (3) buy 2 identical bundles → 2(x + 3).',
    lkpdInstruction:
      'Study Note: Sketch the tile arrangement, write the symbolic expression, and note why the notebook price uses the variable x.',
    reasoningPrompt:
      'Why is the notebook price represented by the variable x, while the pencil (2) and eraser (1) use unit tiles (+1)?',
    rewardXp: 90,
  },
  {
    id: 'ctl-activity-2',
    order: 2,
    title: 'Mission 2 — Exploring Algebraic Properties',
    subtitle: 'Observing what changes and what stays the same when reordering or regrouping',
    ctlPillars: ['Compare', 'Model', 'Reflect'],
    contextStory:
      'Place an x tile and three +1 unit tiles in different orders, then group the three parts of a purchase in two different ways.',
    taskSummary:
      'Compare left and right models: (1) Commutative: x + 3 vs 3 + x; (2) Associative: (x + 2) + 1 vs x + (2 + 1). Notice what changes and what stays invariant.',
    lkpdInstruction:
      'Observation Table: Record which parts change (tile order or parentheses) and which parts stay invariant (tile counts of each type and total value).',
    reasoningPrompt:
      'Based on your tile comparison, what changes and what stays the same in the commutative property (x + 3 vs 3 + x) and the associative property ((x + 2) + 1 vs x + (2 + 1))?',
    rewardXp: 100,
  },
  {
    id: 'ctl-activity-3',
    order: 3,
    title: 'Mission 3 — Building Two Equal Groups',
    subtitle: 'Discovering 2(x + 3) = 2x + 6 through repeated bundles and testing x = 4',
    ctlPillars: ['Group', 'Verify', 'Conclude'],
    contextStory:
      'You buy 2 identical stationery bundles. Each bundle contains 1 notebook (+x) and 3 unit items (+1). When both bundles are combined, how many +x and +1 tiles do you have in total?',
    taskSummary:
      'Arrange 2 groups each containing (1 +x tile and 3 +1 tiles), see why 2(x + 3) = 2x + 6, and verify equivalence by substituting x = 4 into both expressions.',
    lkpdInstruction:
      'Verification Note: Test x = 4 in both 2(x + 3) and 2x + 6, then explain why both expressions are equivalent.',
    reasoningPrompt:
      'Explain why 2(x + 3) expands to 2x + 6 (not 2x + 3), and how testing x = 4 confirms this equivalence.',
    rewardXp: 110,
  },
  {
    id: 'ctl-activity-4',
    order: 4,
    title: 'Mission 4 — Equivalent Expressions Challenge',
    subtitle: 'Choosing Challenge A, B, or C, building both tile models, and defending equivalence',
    ctlPillars: ['Challenge', 'Prove', 'Explain'],
    contextStory:
      'Choose one expression pair (Challenge A, B, or C), prove their equivalence using Algebra Tiles on both boards, and write a clear mathematical explanation.',
    taskSummary:
      'Pick Challenge A (x + 5 and 5 + x), Challenge B ((x + 4) + 2 and x + (4 + 2)), or Challenge C (3(x + 2) and 3x + 6), inspect both tile models, and submit your reasoning.',
    lkpdInstruction:
      'Proof Note: Compare the left and right tile models for your selected Challenge and summarize why both forms represent the same value.',
    reasoningPrompt:
      'Write your explanation: how do the Algebra Tile models prove that both expressions in your chosen Challenge are equivalent?',
    rewardXp: 120,
  },
];

export const CTL_CHALLENGE_OPTIONS: CtlChallengeOption[] = [
  {
    id: 'A',
    title: 'Challenge A — Commutative Property',
    leftExpression: 'x + 5',
    rightExpression: '5 + x',
    leftTarget: { x2: 0, x: 1, constant: 5 },
    rightTarget: { x2: 0, x: 1, constant: 5 },
    observationPrompt: 'The order changes from (x then 5) to (5 then x), yet the total remains 1 +x tile and 5 +1 tiles.',
    sampleReasoning: 'x + 5 and 5 + x are equivalent by the commutative property of addition: swapping the positions of +x and five +1 tiles does not change the total value.',
  },
  {
    id: 'B',
    title: 'Challenge B — Associative Property',
    leftExpression: '(x + 4) + 2',
    rightExpression: 'x + (4 + 2)',
    leftTarget: { x2: 0, x: 1, constant: 6 },
    rightTarget: { x2: 0, x: 1, constant: 6 },
    observationPrompt: 'The grouping parentheses change, yet both models contain 1 +x tile and 6 +1 tiles (x + 6).',
    sampleReasoning: '(x + 4) + 2 and x + (4 + 2) both have 1 +x tile and 6 +1 tiles, so both simplify to x + 6.',
  },
  {
    id: 'C',
    title: 'Challenge C — Distributive Property',
    leftExpression: '3(x + 2)',
    rightExpression: '3x + 6',
    leftTarget: { x2: 0, x: 3, constant: 6 },
    rightTarget: { x2: 0, x: 3, constant: 6 },
    leftGroups: 3,
    rightGroups: 1,
    observationPrompt: 'Three groups each containing (x + 2) combine into 3 +x tiles and 3 × 2 = 6 +1 tiles.',
    sampleReasoning: '3(x + 2) means 3 equal groups of (x + 2), giving 3 +x tiles and 6 +1 tiles, which matches 3x + 6.',
  },
];

export const OPERATION_LAB_CONFIG: OperationModuleConfig[] = [
  {
    id: 'addition',
    title: 'Addition of Algebraic Expressions',
    shortTitle: 'Addition',
    subtitle: 'Combining like terms by adding their coefficients',
    ruleSummary: 'a·x + b·x = (a + b)x. Like terms combine; unlike terms remain separate.',
    scopeBoundaryNote:
      'Only tiles representing the same term type (x² with x², x with x, 1 with 1) can have their coefficients added together.',
    materiPoints: [
      'Addition works by grouping like terms together first.',
      'With Algebra Tiles, combining 3 +x tiles and 2 +x tiles gives 5 +x tiles, or 5x.',
      'Unlike terms (such as 3x and +4) stay separate and are written as 3x + 4.',
    ],
    workedExamples: [
      {
        id: 'add-ex-1',
        title: 'Example 1: Single Like Terms',
        problem: '3x + 2x = ...',
        steps: [
          'Set up the first group with 3 +x tiles (3x).',
          'Set up the second group with 2 +x tiles (2x).',
          'Because both groups use +x rectangular tiles (like terms), add their counts: 3 + 2 = 5 +x tiles.',
        ],
        visualGroups: [
          { groupLabel: 'Term 1 (3x)', tiles: [{ type: 'x', sign: 1, count: 3 }] },
          { groupLabel: 'Term 2 (2x)', tiles: [{ type: 'x', sign: 1, count: 2 }] },
        ],
        finalExpression: '5x',
        takeaway: 'Add coefficients of like terms: 3x + 2x = (3 + 2)x = 5x.',
      },
      {
        id: 'add-ex-2',
        title: 'Example 2: Adding Two Algebraic Expressions',
        problem: '(2x + 3) + (x + 1) = ...',
        steps: [
          'Group the x terms together: 2x + x = 3x.',
          'Group the constant terms together: 3 + 1 = 4.',
          'Write the simplified sum without mixing x tiles and constant tiles.',
        ],
        visualGroups: [
          {
            groupLabel: 'Expression 1 (2x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 2 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
          {
            groupLabel: 'Expression 2 (x + 1)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 1 },
            ],
          },
        ],
        finalExpression: '3x + 4',
        takeaway: '(2x + 3) + (x + 1) = (2x + x) + (3 + 1) = 3x + 4.',
      },
    ],
    exercises: [
      {
        id: 'oplab-add-1',
        prompt: 'Simplify the sum of like terms: 3x + 2x',
        problemLabel: '3x + 2x',
        expectedTarget: { x2: 0, x: 5, constant: 0 },
        placeholder: 'e.g. 5x',
        hint: 'You have 3 +x tiles plus 2 +x tiles. How many +x tiles is that altogether?',
        explanation: '3x and 2x are like terms, so their coefficients add: (3 + 2)x = 5x.',
        visualPresetTiles: [{ type: 'x', sign: 1, count: 5 }],
      },
      {
        id: 'oplab-add-2',
        prompt: 'Find the sum: (2x + 3) + (3x + 1)',
        problemLabel: '(2x + 3) + (3x + 1)',
        expectedTarget: { x2: 0, x: 5, constant: 4 },
        placeholder: 'e.g. 5x + 4',
        hint: 'Combine the x terms first (2x + 3x), then combine the constants (3 + 1).',
        explanation: '2x + 3x = 5x and 3 + 1 = 4, giving 5x + 4.',
        visualPresetTiles: [
          { type: 'x', sign: 1, count: 5 },
          { type: '1', sign: 1, count: 4 },
        ],
      },
    ],
  },
  {
    id: 'subtraction',
    title: 'Subtraction of Algebraic Expressions',
    shortTitle: 'Subtraction',
    subtitle: 'Subtracting coefficients of like terms or adding opposites (zero pairs)',
    ruleSummary: 'a·x − b·x = (a − b)x. Subtracting a term can be modeled by removing tiles or pairing with opposite (−) tiles.',
    scopeBoundaryNote:
      'Remove matching tiles or add opposite tiles (zero pairs) only between terms of the exact same type.',
    materiPoints: [
      'Subtracting like terms reduces the coefficient of the matching variable.',
      'For 5x − 3x, start with 5 +x tiles and remove 3 +x tiles (or add 3 −x tiles to cancel 3 zero pairs), leaving 2 +x tiles = 2x.',
      'When subtracting a grouped expression like (4x + 5) − (x + 2), subtract every term inside: 4x − x = 3x and 5 − 2 = 3.',
    ],
    workedExamples: [
      {
        id: 'sub-ex-1',
        title: 'Example 1: Subtracting Like Terms',
        problem: '5x − 3x = ...',
        steps: [
          'Start with 5 +x tiles (5x).',
          'Subtract 3 +x tiles (or add 3 −x tiles to create 3 zero pairs).',
          'Two +x tiles remain active, so the result is 2x.',
        ],
        visualGroups: [
          { groupLabel: 'Start (5x)', tiles: [{ type: 'x', sign: 1, count: 5 }] },
          { groupLabel: 'Opposite / Subtracted (−3x)', tiles: [{ type: 'x', sign: -1, count: 3 }] },
        ],
        finalExpression: '2x',
        takeaway: '5x − 3x = (5 − 3)x = 2x.',
      },
      {
        id: 'sub-ex-2',
        title: 'Example 2: Subtracting Two Expressions',
        problem: '(4x + 5) − (x + 2) = ...',
        steps: [
          'Subtract the x terms: 4x − x = 3x.',
          'Subtract the constants: 5 − 2 = 3.',
          'The final simplified expression is 3x + 3.',
        ],
        visualGroups: [
          {
            groupLabel: 'Start (4x + 5)',
            tiles: [
              { type: 'x', sign: 1, count: 4 },
              { type: '1', sign: 1, count: 5 },
            ],
          },
          {
            groupLabel: 'Subtract (x + 2)',
            tiles: [
              { type: 'x', sign: -1, count: 1 },
              { type: '1', sign: -1, count: 2 },
            ],
          },
        ],
        finalExpression: '3x + 3',
        takeaway: '(4x + 5) − (x + 2) = (4x − x) + (5 − 2) = 3x + 3.',
      },
    ],
    exercises: [
      {
        id: 'oplab-sub-1',
        prompt: 'Simplify the subtraction of like terms: 5x − 3x',
        problemLabel: '5x − 3x',
        expectedTarget: { x2: 0, x: 2, constant: 0 },
        placeholder: 'e.g. 2x',
        hint: 'From 5 +x tiles, take away 3 +x tiles (or cancel 3 zero pairs). How many +x tiles remain?',
        explanation: '5x − 3x = (5 − 3)x = 2x.',
        visualPresetTiles: [
          { type: 'x', sign: 1, count: 5 },
          { type: 'x', sign: -1, count: 3 },
        ],
      },
      {
        id: 'oplab-sub-2',
        prompt: 'Simplify the subtraction: (4x + 5) − (x + 2)',
        problemLabel: '(4x + 5) − (x + 2)',
        expectedTarget: { x2: 0, x: 3, constant: 3 },
        placeholder: 'e.g. 3x + 3',
        hint: 'Subtract x from 4x, and subtract 2 from 5.',
        explanation: '4x − x = 3x and 5 − 2 = 3, resulting in 3x + 3.',
        visualPresetTiles: [
          { type: 'x', sign: 1, count: 4 },
          { type: '1', sign: 1, count: 5 },
          { type: 'x', sign: -1, count: 1 },
          { type: '1', sign: -1, count: 2 },
        ],
      },
    ],
  },
  {
    id: 'multiplication',
    title: 'Multiplying a Number by a Grouped Expression',
    shortTitle: 'Multiplication',
    subtitle: 'Modeling the distributive property k(x + a) with repeated tile groups',
    ruleSummary: 'k(x + a) = kx + ka. Every term inside the parentheses is multiplied by k.',
    scopeBoundaryNote:
      'Focuses on multiplying a scalar by a grouped expression such as 2(x + 3) or 3(x + 2) using repeated equal groups.',
    materiPoints: [
      'Multiplying 2(x + 3) means forming 2 equal tile groups, each containing (x + 3).',
      'Always write the intermediate distributive step before the final answer: 2(x + 3) = 2 × x + 2 × 3 = 2x + 6.',
      'Watch out for a common mistake: forgetting to multiply the constant (writing 2x + 3 instead of 2x + 6). Equal groups show why both terms are multiplied by 2.',
    ],
    workedExamples: [
      {
        id: 'mul-ex-1',
        title: 'Example 1: Two Groups of (x + 3)',
        problem: '2(x + 3) = ...',
        steps: [
          'Build 2 identical groups, each containing 1 +x tile and 3 +1 tiles.',
          'Write the intermediate distributive expansion: 2(x + 3) = 2 × x + 2 × 3.',
          'Compute each product: 2 × x = 2x and 2 × 3 = 6, giving 2x + 6.',
        ],
        visualGroups: [
          {
            groupLabel: 'Group 1: (x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
          {
            groupLabel: 'Group 2: (x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
        ],
        finalExpression: '2x + 6',
        takeaway: 'Distributive property: 2(x + 3) = 2 × x + 2 × 3 = 2x + 6.',
      },
      {
        id: 'mul-ex-2',
        title: 'Example 2: Three Groups of (x + 2)',
        problem: '3(x + 2) = ...',
        steps: [
          'Arrange 3 identical groups, each with 1 +x tile and 2 +1 tiles.',
          'Write the intermediate distributive step: 3(x + 2) = 3 × x + 3 × 2.',
          'Count the tiles across all 3 groups: 3 +x tiles and 6 +1 tiles, giving 3x + 6.',
        ],
        visualGroups: [
          {
            groupLabel: 'Group 1: (x + 2)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 2 },
            ],
          },
          {
            groupLabel: 'Group 2: (x + 2)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 2 },
            ],
          },
          {
            groupLabel: 'Group 3: (x + 2)',
            tiles: [
              { type: 'x', sign: 1, count: 1 },
              { type: '1', sign: 1, count: 2 },
            ],
          },
        ],
        finalExpression: '3x + 6',
        takeaway: '3(x + 2) = 3 × x + 3 × 2 = 3x + 6.',
      },
    ],
    exercises: [
      {
        id: 'oplab-mul-1',
        prompt: 'Expand using the distributive property: 2(x + 4)',
        problemLabel: '2(x + 4)',
        expectedTarget: { x2: 0, x: 2, constant: 8 },
        placeholder: 'e.g. 2x + 8',
        hint: 'Picture 2 groups, each containing 1 +x tile and 4 +1 tiles: 2(x + 4) = 2 × x + 2 × 4.',
        explanation: '2(x + 4) = 2 × x + 2 × 4 = 2x + 8 (2 +x tiles and 8 +1 tiles).',
        groupVisualConfig: {
          groupsCount: 2,
          perGroup: [
            { type: 'x', sign: 1, count: 1 },
            { type: '1', sign: 1, count: 4 },
          ],
          mode: 'repeat',
        },
      },
      {
        id: 'oplab-mul-2',
        prompt: 'Expand using the distributive property: 3(x + 2)',
        problemLabel: '3(x + 2)',
        expectedTarget: { x2: 0, x: 3, constant: 6 },
        placeholder: 'e.g. 3x + 6',
        hint: 'Multiply 3 by both terms inside the parentheses: 3 × x + 3 × 2.',
        explanation: '3(x + 2) = 3 × x + 3 × 2 = 3x + 6.',
        groupVisualConfig: {
          groupsCount: 3,
          perGroup: [
            { type: 'x', sign: 1, count: 1 },
            { type: '1', sign: 1, count: 2 },
          ],
          mode: 'repeat',
        },
      },
    ],
  },
  {
    id: 'division',
    title: 'Dividing Algebraic Expressions by a Non-Zero Number',
    shortTitle: 'Division',
    subtitle: 'Sharing a tile collection evenly into k equal groups (k ≠ 0)',
    ruleSummary: '(ax + b) ÷ k = ax ÷ k + b ÷ k, provided k ≠ 0.',
    scopeBoundaryNote:
      'Division by 0 is undefined and rejected. When division leaves a fraction (such as (6x + 9) ÷ 2 = 3x + 9/2), tiles are never cut into fake partial pieces—symbolic fraction mode is shown instead.',
    materiPoints: [
      'Dividing 6x by 3 means sharing 6 +x tiles evenly across 3 equal groups: 6x ÷ 3 = (6 ÷ 3)x = 2x.',
      'For (6x + 9) ÷ 3, divide each term by 3 evenly: (6x + 9) ÷ 3 = 6x ÷ 3 + 9 ÷ 3 = 2x + 3.',
      'If a divisor does not split every term evenly (such as 5x ÷ 2 or (6x + 9) ÷ 2), symbolic mode displays the exact fraction without slicing tiles.',
    ],
    workedExamples: [
      {
        id: 'div-ex-1',
        title: 'Example 1: Single-Term Division',
        problem: '6x ÷ 3 = ...',
        steps: [
          'Start with 6 +x tiles.',
          'Share them evenly across 3 equal groups: 6x ÷ 3 = (6 ÷ 3)x.',
          'Each group receives 2 +x tiles, so the quotient is 2x.',
        ],
        visualGroups: [
          { groupLabel: 'Group 1 (2x)', tiles: [{ type: 'x', sign: 1, count: 2 }] },
          { groupLabel: 'Group 2 (2x)', tiles: [{ type: 'x', sign: 1, count: 2 }] },
          { groupLabel: 'Group 3 (2x)', tiles: [{ type: 'x', sign: 1, count: 2 }] },
        ],
        finalExpression: '2x',
        takeaway: '6x ÷ 3 = (6 ÷ 3)x = 2x.',
      },
      {
        id: 'div-ex-2',
        title: 'Example 2: Two-Term Division',
        problem: '(6x + 9) ÷ 3 = ...',
        steps: [
          'Divide each term separately: (6x + 9) ÷ 3 = 6x ÷ 3 + 9 ÷ 3.',
          'Divide the variable term (6x ÷ 3 = 2x) and constant (9 ÷ 3 = 3).',
          'Each of the 3 groups receives 2 +x tiles and 3 +1 tiles, giving 2x + 3.',
        ],
        visualGroups: [
          {
            groupLabel: 'Group 1 (2x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 2 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
          {
            groupLabel: 'Group 2 (2x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 2 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
          {
            groupLabel: 'Group 3 (2x + 3)',
            tiles: [
              { type: 'x', sign: 1, count: 2 },
              { type: '1', sign: 1, count: 3 },
            ],
          },
        ],
        finalExpression: '2x + 3',
        takeaway: '(6x + 9) ÷ 3 = 6x ÷ 3 + 9 ÷ 3 = 2x + 3.',
      },
    ],
    exercises: [
      {
        id: 'oplab-div-1',
        prompt: 'Find the quotient: 6x ÷ 3',
        problemLabel: '6x ÷ 3',
        expectedTarget: { x2: 0, x: 2, constant: 0 },
        placeholder: 'e.g. 2x',
        hint: 'Share 6 +x tiles evenly into 3 equal groups. How many tiles are in 1 group?',
        explanation: '6 +x tiles split evenly into 3 groups give 2 +x tiles per group (2x).',
        groupVisualConfig: {
          groupsCount: 3,
          perGroup: [{ type: 'x', sign: 1, count: 2 }],
          mode: 'split',
        },
      },
      {
        id: 'oplab-div-2',
        prompt: 'Find the quotient: (6x + 9) ÷ 3',
        problemLabel: '(6x + 9) ÷ 3',
        expectedTarget: { x2: 0, x: 2, constant: 3 },
        placeholder: 'e.g. 2x + 3',
        hint: 'Divide both terms by 3: 6x ÷ 3 and 9 ÷ 3.',
        explanation: '(6x + 9) ÷ 3 = (6x ÷ 3) + (9 ÷ 3) = 2x + 3.',
        groupVisualConfig: {
          groupsCount: 3,
          perGroup: [
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: 1, count: 3 },
          ],
          mode: 'split',
        },
      },
    ],
  },
];

export const TOPICS_CONFIG: TopicConfig[] = [
  {
    id: 'topic-dasar',
    levelId: 'level-1',
    title: '01. Algebra Foundations & Tiles',
    subtitle: 'Variables, coefficients, constants, terms, and the x², x, and 1 tile models',
    estimatedMinutes: 5,
    lessons: [
      {
        id: 'lesson-1-1',
        title: 'Variables, Coefficients, Constants & Terms with Algebra Tiles',
        objective: 'Recognize core algebraic parts and how x², x, and 1 tiles represent them.',
        explanation:
          'In an algebraic expression such as 2x + 3, x is the variable (an unknown quantity, such as the price of 1 notebook), 2 in front of x is the coefficient, and 3 is the constant. With Algebra Tiles, the large square stands for x², the rectangle stands for x, and the small unit square stands for 1.',
        visualDemo: {
          caption: 'Example model: 1 +x² tile, 2 +x tiles, and 3 +1 tiles',
          tiles: [
            { type: 'x2', sign: 1, count: 1 },
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: 1, count: 3 },
          ],
          symbolicResult: 'x² + 2x + 3',
          highlightNote: 'Every tile clearly displays both its symbolic label and + or − sign.',
        },
        summary: 'x² = large square, x = bar, 1 = unit square. The number in front of a variable is its coefficient.',
        checkQuestion: {
          prompt: 'If there are 2 rectangular +x tiles and 4 small unit +1 tiles, which expression do they represent?',
          options: ['2x² + 4', '2x + 4', '6x', 'x + 6'],
          correctIndex: 1,
          explanation:
            '2 +x tiles equal 2x and 4 +1 tiles equal 4. Since they are unlike terms, the expression is 2x + 4.',
        },
      },
      {
        id: 'lesson-1-2',
        title: 'Positive Tiles, Negative Tiles & Real-World Models',
        objective: 'Distinguish + and − tiles and translate everyday situations into algebra.',
        explanation:
          'Each term type has a positive version (+ in teal/blue) and a negative version (− in orange/red). In a stationery shop example, 1 notebook costing x plus 2 pencils costing 1 each is written as x + 2.',
        visualDemo: {
          caption: 'Tile model for −x² + 2x − 3',
          tiles: [
            { type: 'x2', sign: -1, count: 1 },
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: -1, count: 3 },
          ],
          symbolicResult: '−x² + 2x − 3',
          highlightNote: 'Look at both the tile color and the + or − symbol at the center.',
        },
        summary: 'Negative tiles have the exact same shape as positive tiles, with opposite color and a − sign.',
        checkQuestion: {
          prompt: 'Which set of tiles accurately represents 3x − 2?',
          options: [
            '3 +x tiles and 2 +1 tiles',
            '3 −x tiles and 2 −1 tiles',
            '3 +x tiles and 2 −1 tiles',
            '1 +x² tile and 2 −1 tiles',
          ],
          correctIndex: 2,
          explanation: 'Positive 3x is modeled with 3 +x tiles, and −2 is modeled with 2 −1 tiles.',
        },
      },
    ],
  },
  {
    id: 'topic-suku-sejenis',
    levelId: 'level-2',
    title: '02. Like Terms & Algebraic Properties',
    subtitle: 'Combining like terms and exploring order, grouping, and repeated bundles',
    estimatedMinutes: 6,
    lessons: [
      {
        id: 'lesson-2-1',
        title: 'Why Can Only Like Terms Be Combined?',
        objective: 'Combine 3x + 2x into 5x and understand why 2x + 3 stays separate.',
        explanation:
          'When you have 3 +x tiles and add 2 more +x tiles, all of them are identical x bars, forming 5x. Constants combine similarly (2 + 4 = 6), but 2x and 3 are unlike terms and cannot merge into 5x.',
        visualDemo: {
          caption: 'Combining 2x + 3x + 2 + 4',
          tiles: [
            { type: 'x', sign: 1, count: 5 },
            { type: '1', sign: 1, count: 6 },
          ],
          symbolicResult: '5x + 6',
          highlightNote: '5x and 6 remain separate because their tile shapes represent different term types.',
        },
        summary: 'Only tiles of the exact same shape and term type can have their coefficients added.',
        checkQuestion: {
          prompt: 'Why can 2x + 3 NOT be simplified to 5x?',
          options: [
            'Because 2 and 3 cannot be added in arithmetic',
            'Because x tiles and 1 tiles represent unlike term types',
            'Because the coefficient of x must be larger than the constant',
            'Because the + sign works differently in algebra',
          ],
          correctIndex: 1,
          explanation:
            'An x tile represents a variable term while a 1 tile represents a constant. Because they are unlike terms, 2x + 3 is already in simplest form.',
        },
      },
      {
        id: 'lesson-2-2',
        title: 'Commutative, Associative & Distributive Properties',
        objective: 'See why x + 3 = 3 + x, (x + 2) + 1 = x + (2 + 1), and 2(x + 3) = 2x + 6.',
        explanation:
          'With the commutative property, changing x + 3 to 3 + x only changes order while tile counts stay the same. With the associative property, (x + 2) + 1 and x + (2 + 1) change grouping while keeping x + 3 total tiles. With the distributive property, 2(x + 3) creates 2 groups of (x + 3), totaling 2x + 6.',
        visualDemo: {
          caption: 'Two equal groups of (x + 3) form 2(x + 3) = 2x + 6',
          tiles: [
            { type: 'x', sign: 1, count: 2 },
            { type: '1', sign: 1, count: 6 },
          ],
          symbolicResult: '2(x + 3) = 2x + 6',
          highlightNote: 'Substitution check at x = 4: 2(4 + 3) = 14 and 2(4) + 6 = 14!',
        },
        summary: 'Order or parentheses may change without changing total value when tile counts match.',
        checkQuestion: {
          prompt: 'If you form 2 bundles each containing (x + 3), which expanded expression is equivalent?',
          options: ['2x + 3', 'x + 6', '2x + 6', '5x'],
          correctIndex: 2,
          explanation: 'Two bundles of (x + 3) contain 2 +x tiles and 2 × 3 = 6 +1 tiles, which equals 2x + 6.',
        },
      },
    ],
  },
  {
    id: 'topic-zero-pair',
    levelId: 'level-3',
    title: '03. Zero Pairs & Subtraction',
    subtitle: 'Cancelling opposite pairs (+ and −) to simplify algebraic expressions',
    estimatedMinutes: 6,
    lessons: [
      {
        id: 'lesson-3-1',
        title: 'Understanding Zero Pairs',
        objective: 'Pair and cancel +x with −x or +1 with −1.',
        explanation:
          'One positive tile and one negative tile of the same term type add up to exactly 0. This is called a Zero Pair. Because their combined value is 0, cancelling them simplifies the expression without changing its value!',
        visualDemo: {
          caption: '3 +x tiles and 1 −x tile form 1 zero pair, leaving 2x',
          tiles: [
            { type: 'x', sign: 1, count: 3 },
            { type: 'x', sign: -1, count: 1 },
          ],
          symbolicResult: '2x',
          highlightNote: 'One +x pairs with one −x to make 0, leaving 2 active +x tiles.',
        },
        summary: 'A zero pair forms only when two tiles have the SAME term type and OPPOSITE signs.',
        checkQuestion: {
          prompt: 'Which pair of tiles forms a valid Zero Pair?',
          options: ['+x and −1', '+x² and −x', '+x and −x', '+1 and +1'],
          correctIndex: 2,
          explanation: '+x and −x share the same term type (x) with opposite signs (+ and −).',
        },
      },
      {
        id: 'lesson-3-2',
        title: 'Subtraction as Adding the Opposite',
        objective: 'Model algebraic subtraction using negative tiles and zero pairs.',
        explanation:
          'Subtracting a term is equivalent to adding its opposite. For example, 5x − 3x can be modeled as 5 +x tiles plus 3 −x tiles, cancelling 3 zero pairs to leave 2x.',
        visualDemo: {
          caption: 'Modeling 5x − 3x with zero pairs leaves 2x',
          tiles: [
            { type: 'x', sign: 1, count: 5 },
            { type: 'x', sign: -1, count: 3 },
          ],
          symbolicResult: '2x',
          highlightNote: 'Three (+x and −x) pairs cancel to 0, leaving two +x tiles.',
        },
        summary: 'Subtracting b is the same as adding −b: a − b = a + (−b).',
        checkQuestion: {
          prompt: 'If the workspace starts with 2 +x tiles and you add 3 −x tiles then cancel zero pairs, what remains?',
          options: ['+x', '−x', '5x', '0'],
          correctIndex: 1,
          explanation: '2 zero pairs (+x and −x) cancel to zero, leaving 1 −x tile.',
        },
      },
    ],
  },
  {
    id: 'topic-persamaan',
    levelId: 'level-4',
    title: '04. Equation Balance',
    subtitle: 'Solving one-variable linear equations with balanced operations',
    estimatedMinutes: 7,
    lessons: [
      {
        id: 'lesson-4-1',
        title: 'Keeping Both Sides Equal',
        objective: 'Apply identical operations to both the left and right sides of an equation.',
        explanation:
          'Imagine the equals sign (=) as the pivot of a balance scale. If you add −3 to the left side to cancel +3 in x + 3 = 5, you MUST also add −3 to the right side so the equation stays balanced.',
        visualDemo: {
          caption: 'Initial equation x + 3 = 5',
          tiles: [
            { type: 'x', sign: 1, count: 1 },
            { type: '1', sign: 1, count: 3 },
          ],
          rightTiles: [{ type: '1', sign: 1, count: 5 }],
          symbolicResult: 'x + 3 = 5  →  x = 2',
          highlightNote: 'Add −3 to both sides, then match zero pairs!',
        },
        summary: 'Applying an operation to only one side breaks the equality of the equation.',
        checkQuestion: {
          prompt: 'To solve x + 3 = 5 using Algebra Tiles while preserving equality, what should you do?',
          options: [
            'Add −3 to the left side only',
            'Add −3 to both the left side and the right side',
            'Add +3 to the right side only',
            'Delete the x tile from the left side',
          ],
          correctIndex: 1,
          explanation:
            'Adding −3 to both sides preserves equality and simplifies the equation to x = 2.',
        },
      },
    ],
  },
];

export const MISSIONS_CONFIG: Mission[] = [
  {
    id: 'misi-dasar-1',
    levelId: 'level-1',
    order: 1,
    title: 'Stationery Shop Bundle: x + 3',
    topic: 'Mission 1 · Tile Basics',
    learningGoalId: 'Variables & Everyday Models',
    mode: 'explore',
    instructions:
      'At the shop, 1 notebook costs x, 1 pencil = 2, and 1 eraser = 1. Build a tile model for buying 1 notebook, 1 pencil, and 1 eraser (x + 2 + 1 = x + 3)!',
    lkpdPrompt: 'Observation Note: How many +x tiles and +1 tiles represent this purchase?',
    reasoningPrompt: 'Explain why the notebook price is modeled with a +x tile while the pencil and eraser use +1 tiles.',
    initialTiles: [],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 0, x: 1, constant: 3 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Place 1 +x tile for the notebook, 2 +1 tiles for the pencil, and 1 +1 tile for the eraser.',
      'Altogether you should have 1 +x tile and 3 +1 tiles (x + 3).',
    ],
    rewardXp: 80,
  },
  {
    id: 'misi-dasar-2',
    levelId: 'level-1',
    order: 2,
    title: 'Building Quadratic & Negative Terms',
    topic: 'Algebra Foundations',
    learningGoalId: 'Variables, Coefficients, Constants & Signs',
    mode: 'explore',
    instructions: 'Build the expression x² − 2x + 1 using positive and negative Algebra Tiles.',
    lkpdPrompt: 'Observation Note: Why are the −x tiles colored differently and marked with a minus sign?',
    reasoningPrompt: 'How do the coefficient and negative sign shape the −2x term compared with x²?',
    initialTiles: [],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 1, x: -2, constant: 1 },
      requireNoZeroPairs: true,
    },
    hints: [
      'x² needs 1 +x² tile (large square).',
      '−2x needs 2 −x tiles, and +1 needs 1 +1 tile.',
    ],
    rewardXp: 100,
  },
  {
    id: 'misi-suku-1',
    levelId: 'level-2',
    order: 3,
    title: 'Combine Like Terms: 2x + 3x + 2 + 4',
    topic: 'Like Terms',
    learningGoalId: 'Like Terms & Addition',
    mode: 'explore',
    instructions:
      'The workspace starts with tiles for 2x + 3x + 2 + 4. Group like terms together so the simplified form (5x + 6) is clearly visible!',
    lkpdPrompt: 'Observation Note: Explain why 5x and 6 cannot be combined into 11x.',
    reasoningPrompt: 'Why can all +x tiles combine into 5x while 5x and 6 must stay separate?',
    initialTiles: [
      { type: 'x', sign: 1, count: 2 },
      { type: '1', sign: 1, count: 2 },
      { type: 'x', sign: 1, count: 3 },
      { type: '1', sign: 1, count: 4 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 5, constant: 6 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Drag like tiles close together to snap them into groups, or click "Group Like Terms".',
      'You have 5 +x tiles (5x) and 6 +1 tiles (6).',
    ],
    rewardXp: 110,
  },
  {
    id: 'misi-suku-2',
    levelId: 'level-2',
    order: 4,
    title: 'Two Equal Bundles: 2(x + 3) = 2x + 6',
    topic: 'Mission 3 · Distributive',
    learningGoalId: 'Distributive Property & Equivalence',
    mode: 'explore',
    instructions:
      'The board already has 1 bundle of (x + 3). Add 1 more identical bundle to form 2(x + 3) = 2x + 6!',
    lkpdPrompt: 'Verification Note: Test x = 4—does 2(4 + 3) give the same value as 2(4) + 6?',
    reasoningPrompt: 'Why does 2(x + 3) equal 2x + 6 instead of 2x + 3?',
    initialTiles: [
      { type: 'x', sign: 1, count: 1 },
      { type: '1', sign: 1, count: 3 },
    ],
    validationRule: {
      type: 'exact_tiles',
      target: { x2: 0, x: 2, constant: 6 },
      requireNoZeroPairs: true,
    },
    hints: [
      'One bundle is already placed (1 +x tile and 3 +1 tiles).',
      'To build 2 bundles (2(x + 3)), add 1 more +x tile and 3 more +1 tiles.',
    ],
    rewardXp: 120,
  },
  {
    id: 'misi-zero-1',
    levelId: 'level-3',
    order: 5,
    title: 'Spot & Cancel Zero Pairs',
    topic: 'Zero Pairs',
    learningGoalId: 'Subtraction & Zero Pairs',
    mode: 'explore',
    instructions:
      'The board contains 3 +x tiles, 2 −x tiles, and 4 +1 tiles. Stack and cancel every zero pair to reveal the simplified expression!',
    lkpdPrompt: 'Observation Note: Record how many zero pairs you cancelled.',
    reasoningPrompt: 'Why does cancelling a pair of +x and −x tiles leave the expression value unchanged?',
    initialTiles: [
      { type: 'x', sign: 1, count: 3 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 4 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 1, constant: 4 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Drag a −x tile onto a +x tile to stack them, or click "Match Zero Pairs".',
      'After 2 zero pairs cancel out, x + 4 remains active.',
    ],
    rewardXp: 130,
  },
  {
    id: 'misi-zero-2',
    levelId: 'level-3',
    order: 6,
    title: 'Subtracting Opposites: (2x + 3) − (x + 1)',
    topic: 'Zero Pairs & Subtraction',
    learningGoalId: 'Algebraic Subtraction',
    mode: 'explore',
    instructions:
      'Simplify (2x + 3) − (x + 1) by adding the opposite tiles (−x and −1) and cancelling zero pairs until the simplest form remains.',
    lkpdPrompt: 'Observation Note: Why is subtracting (x + 1) equivalent to adding −x and −1?',
    reasoningPrompt: 'How does the zero pair model help you solve (2x + 3) − (x + 1)?',
    initialTiles: [
      { type: 'x', sign: 1, count: 2 },
      { type: '1', sign: 1, count: 3 },
    ],
    validationRule: {
      type: 'equivalent_simplified',
      target: { x2: 0, x: 1, constant: 2 },
      requireNoZeroPairs: true,
    },
    hints: [
      'Add 1 −x tile and 1 −1 tile from the Tile Palette as the opposite of (x + 1).',
      'Click "Match Zero Pairs" to cancel opposite tiles, leaving x + 2.',
    ],
    rewardXp: 140,
  },
  {
    id: 'misi-persamaan-1',
    levelId: 'level-4',
    order: 7,
    title: 'Balancing Equations: x + 3 = 5',
    topic: 'Equation Balance',
    learningGoalId: 'Equivalent Equations & Balance',
    mode: 'equation',
    instructions:
      'Solve x + 3 = 5 to find x = 2 by adding the same negative tiles to BOTH sides of the equation, then cancelling zero pairs!',
    lkpdPrompt: 'Observation Note: Which operation did you apply to both the left and right sides?',
    reasoningPrompt: 'Why must we add 3 −1 tiles to both sides to keep the equation balanced?',
    initialEquation: {
      left: [
        { type: 'x', sign: 1, count: 1 },
        { type: '1', sign: 1, count: 3 },
      ],
      right: [{ type: '1', sign: 1, count: 5 }],
    },
    validationRule: {
      type: 'equation_solve',
      target: { x2: 0, x: 1, constant: 2 },
      targetVariableValue: 2,
    },
    hints: [
      'To cancel +3 on the left side, add 3 −1 tiles to BOTH sides.',
      'After adding −3 to both sides, click "Match Zero Pairs" to isolate x = 2.',
    ],
    rewardXp: 160,
  },
  {
    id: 'misi-persamaan-2',
    levelId: 'level-4',
    order: 8,
    title: 'Equations with Negatives: x − 2 = 4',
    topic: 'Equation Balance',
    learningGoalId: 'Equivalent Equations & Balance',
    mode: 'equation',
    instructions:
      'Solve x − 2 = 4 to isolate x. Add the matching opposite tiles to both sides and match zero pairs!',
    lkpdPrompt: 'Observation Note: Why do we add +1 tiles to both sides this time?',
    reasoningPrompt: 'Explain how you kept both sides equal while solving x − 2 = 4.',
    initialEquation: {
      left: [
        { type: 'x', sign: 1, count: 1 },
        { type: '1', sign: -1, count: 2 },
      ],
      right: [{ type: '1', sign: 1, count: 4 }],
    },
    validationRule: {
      type: 'equation_solve',
      target: { x2: 0, x: 1, constant: 6 },
      targetVariableValue: 6,
    },
    hints: [
      'The left side has 2 −1 tiles. The opposite of −2 is +2.',
      'Add 2 +1 tiles to both sides, then click "Match Zero Pairs" to get x = 6.',
    ],
    rewardXp: 180,
  },
];

export const ASSESSMENT_ITEMS: AssessmentItem[] = [
  // Core Concept Check (Exit Tickets)
  {
    id: 'exit-ticket-1',
    topic: 'Core Check 1 · Stationery Model',
    unit: 'exit_ticket',
    type: 'symbolic_input',
    prompt: 'One notebook costs x and two pencils cost 1 each. Write the algebraic expression!',
    contextHint: 'Use x for the notebook and combine the 2 pencils (1 + 1 = 2).',
    expectedTarget: { x2: 0, x: 1, constant: 2 },
    acceptedSymbolicForms: ['x + 2', '2 + x'],
    explanation:
      '1 notebook is x and 2 pencils worth 1 each equal 2, giving the expression x + 2.',
    recommendedTopicId: 'topic-dasar',
  },
  {
    id: 'exit-ticket-2',
    topic: 'Core Check 2 · Commutative Property',
    unit: 'exit_ticket',
    type: 'symbolic_input',
    prompt: 'Write an equivalent expression for 4 + x by swapping the order of the terms (commutative property)!',
    contextHint: 'Write the variable term first in standard algebraic form.',
    expectedTarget: { x2: 0, x: 1, constant: 4 },
    acceptedSymbolicForms: ['x + 4'],
    explanation:
      'By the commutative property of addition, 4 + x is equivalent to x + 4 because the counts of +x and +1 tiles stay the same.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'exit-ticket-3',
    topic: 'Core Check 3 · Distributive Property',
    unit: 'exit_ticket',
    type: 'symbolic_input',
    prompt: 'Expand the product 2(x + 4)!',
    contextHint: 'Picture 2 groups, each containing 1 +x tile and 4 +1 tiles.',
    expectedTarget: { x2: 0, x: 2, constant: 8 },
    acceptedSymbolicForms: ['2x + 8'],
    explanation:
      'By the distributive property, 2(x + 4) = 2·x + 2·4 = 2x + 8, giving 2 +x tiles and 8 +1 tiles.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-dasar-1',
    topic: 'Algebra Foundations',
    unit: 'formatif_dasar',
    type: 'interpret_tiles',
    prompt: 'Look at the Algebra Tiles shown below. Which algebraic expression do they represent?',
    visualTiles: [
      { type: 'x2', sign: 1, count: 1 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 3 },
    ],
    options: ['x² + 2x + 3', 'x² − 2x + 3', '2x² − x + 3', 'x² − 2x − 3'],
    correctOptionIndex: 1,
    explanation:
      'There is 1 +x² tile (large square), 2 −x tiles (negative rectangles), and 3 +1 tiles (positive small squares), representing x² − 2x + 3.',
    recommendedTopicId: 'topic-dasar',
  },
  {
    id: 'q-dasar-2',
    topic: 'Algebra Foundations',
    unit: 'formatif_dasar',
    type: 'build_tiles',
    prompt: 'Arrange Algebra Tiles on the mini board below to build the expression 3x − 2.',
    expectedTarget: { x2: 0, x: 3, constant: -2, requireNoZeroPairs: true },
    explanation: '3x uses 3 +x tiles and −2 uses 2 −1 tiles.',
    recommendedTopicId: 'topic-dasar',
  },
  {
    id: 'q-suku-1',
    topic: 'Like Terms & Operations',
    unit: 'formatif_suku',
    type: 'multiple_choice',
    prompt: 'What is the simplified form of 3x + 2x?',
    options: ['5x²', '5x', '6x', '3x + 2'],
    correctOptionIndex: 1,
    explanation:
      '3x and 2x are like terms, so add their coefficients: (3 + 2)x = 5x.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-suku-2',
    topic: 'Like Terms & Operations',
    unit: 'formatif_suku',
    type: 'multiple_choice',
    prompt: 'Which statement is TRUE about the expression 2x + 3?',
    options: [
      'It simplifies to 5x because 2 + 3 = 5',
      'It simplifies to 5',
      'It cannot be combined because x tiles and 1 tiles are unlike terms',
      'It equals 6x',
    ],
    correctOptionIndex: 2,
    explanation:
      'x tiles represent linear variable terms while 1 tiles represent constants. Because they are unlike terms, 2x + 3 cannot be combined further.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-suku-3',
    topic: 'Algebraic Division',
    unit: 'formatif_suku',
    type: 'multiple_choice',
    prompt: 'What is the quotient of (6x + 9) ÷ 3?',
    options: ['2x + 9', '6x + 3', '2x + 3', '3x + 3'],
    correctOptionIndex: 2,
    explanation:
      'Divide each term evenly by 3: 6x ÷ 3 = 2x and 9 ÷ 3 = 3, giving 2x + 3.',
    recommendedTopicId: 'topic-suku-sejenis',
  },
  {
    id: 'q-zero-1',
    topic: 'Zero Pairs & Subtraction',
    unit: 'formatif_zeropair',
    type: 'interpret_tiles',
    prompt: 'After all zero pairs in the tile model below cancel out, what expression remains?',
    visualTiles: [
      { type: 'x', sign: 1, count: 4 },
      { type: 'x', sign: -1, count: 2 },
      { type: '1', sign: 1, count: 1 },
      { type: '1', sign: -1, count: 3 },
    ],
    options: ['6x + 4', '2x − 2', '2x + 2', '−2x + 2'],
    correctOptionIndex: 1,
    explanation:
      '4 +x tiles and 2 −x tiles cancel 2 zero pairs (leaving 2x). 1 +1 tile and 3 −1 tiles cancel 1 zero pair (leaving −2). Altogether: 2x − 2.',
    recommendedTopicId: 'topic-zero-pair',
  },
  {
    id: 'q-zero-2',
    topic: 'Zero Pairs & Subtraction',
    unit: 'formatif_zeropair',
    type: 'build_tiles',
    prompt: 'Build the simplified result of (3x + 2) + (−x − 5) with no zero pairs remaining.',
    expectedTarget: { x2: 0, x: 2, constant: -3, requireNoZeroPairs: true },
    explanation:
      '3x + (−x) leaves 2x, and +2 + (−5) leaves −3. So the simplified result is 2x − 3 (2 +x tiles and 3 −1 tiles).',
    recommendedTopicId: 'topic-zero-pair',
  },
  {
    id: 'q-persamaan-1',
    topic: 'Equation Balance',
    unit: 'formatif_persamaan',
    type: 'multiple_choice',
    prompt: 'On the equation board x + 4 = 9, a student adds 4 −1 tiles to the left side only. What happens?',
    options: [
      'The equation stays balanced and becomes x = 9',
      'Equality is broken because the operation was not applied to both sides',
      'x automatically becomes 5',
      'The right side automatically loses 4 tiles',
    ],
    correctOptionIndex: 1,
    explanation:
      'In an equation, every operation performed on one side must also be applied to the other side to preserve equality.',
    recommendedTopicId: 'topic-persamaan',
  },
  {
    id: 'q-persamaan-2',
    topic: 'Equation Balance',
    unit: 'formatif_persamaan',
    type: 'multiple_choice',
    prompt: 'If you solve x − 3 = 4 by adding +3 to both sides, what is the final solution?',
    options: ['x = 1', 'x = 7', 'x = −7', 'x = 12'],
    correctOptionIndex: 1,
    explanation:
      'On the left side, −3 and +3 form 3 zero pairs leaving x. On the right side, 4 + 3 = 7. So x = 7.',
    recommendedTopicId: 'topic-persamaan',
  },
];

export const QUIZ_SUITES = [
  {
    id: 'exit_ticket',
    title: 'Core Concept Check (3 Essential Prompts)',
    description:
      'Quick mastery check covering x + 2 modeling, commutative rewriting (4 + x), and distributive expansion 2(x + 4) with worked explanations.',
    units: ['exit_ticket'] as const,
  },
  {
    id: 'evaluasi_akhir',
    title: 'Comprehensive Algebra Evaluation',
    description:
      'Full quiz assessing Core Concept Checks, tile foundations, like terms & operations, zero pairs, and equation balance.',
    units: ['exit_ticket', 'formatif_dasar', 'formatif_suku', 'formatif_zeropair', 'formatif_persamaan'] as const,
  },
  {
    id: 'formatif_dasar',
    title: 'Topic 1 Quiz: Algebra Foundations',
    description: 'Focuses on recognizing x², x, and 1 tiles as well as positive and negative signs.',
    units: ['formatif_dasar'] as const,
  },
  {
    id: 'formatif_suku',
    title: 'Topic 2 Quiz: Like Terms & Operations',
    description: 'Combining like terms, spotting unlike terms, and dividing by non-zero numbers.',
    units: ['formatif_suku'] as const,
  },
  {
    id: 'formatif_zeropair',
    title: 'Topic 3 Quiz: Zero Pairs & Subtraction',
    description: 'Simplifying expressions with zero pairs and adding opposite tiles.',
    units: ['formatif_zeropair'] as const,
  },
  {
    id: 'formatif_persamaan',
    title: 'Topic 4 Quiz: Equation Balance',
    description: 'Keeping both sides equal to isolate and solve for the variable.',
    units: ['formatif_persamaan'] as const,
  },
];
