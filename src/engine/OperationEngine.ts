import { formatSummaryToExpression } from './MathEngine';

export interface ParsedAlgebraExpr {
  x2: number;
  x: number;
  constant: number;
}

/**
 * Parses common algebraic expressions in variable `x` (including distributive forms like `2(x + 3)`,
 * `3(x + 2)`, `2(x + 4)`, commutative `4 + x`, `x + 2 + 1`, unicode `−`, and `x²` / `x^2`).
 * Returns null if the input cannot be parsed cleanly.
 */
export function parseAlgebraExpression(rawInput: string): ParsedAlgebraExpr | null {
  const normalized = rawInput
    .replace(/\u2212/g, '-') // unicode minus − -> -
    .replace(/x²/gi, 'x^2')
    .replace(/\s+/g, '')
    .toLowerCase();

  if (!normalized) return null;

  // Validate allowed characters: digits, x, +, -, *, (, ), ^, ÷, /
  if (!/^[0-9x+\-*()^]+$/.test(normalized)) {
    return null;
  }

  // Expand single-level scalar * parenthetical terms like `2(x+3)` or `-3(2x-1)` or `(x+2)+1`
  let expanded = normalized;

  // Replace `+(...)` or leading `(...)` without scalar with `1(...)` and `-(...)` with `-1(...)`
  expanded = expanded.replace(/(^|[+\-])\(/g, '$11(');
  // Remove optional explicit `*` before `(`
  expanded = expanded.replace(/\*+\(/g, '(');

  const parenRegex = /([+\-]?\d+)\(([^()]+)\)/;
  let safety = 0;
  while (parenRegex.test(expanded) && safety < 8) {
    safety += 1;
    expanded = expanded.replace(parenRegex, (_, multStr: string, inner: string) => {
      const mult = Number(multStr);
      if (!Number.isFinite(mult)) return 'INVALID';
      const innerParsed = parseFlatTerms(inner);
      if (!innerParsed) return 'INVALID';
      const prod: ParsedAlgebraExpr = {
        x2: innerParsed.x2 * mult,
        x: innerParsed.x * mult,
        constant: innerParsed.constant * mult,
      };
      return serializeSignedFlat(prod);
    });
    if (expanded.includes('INVALID')) return null;
  }

  if (expanded.includes('(') || expanded.includes(')')) {
    return null;
  }

  return parseFlatTerms(expanded);
}

function serializeSignedFlat(expr: ParsedAlgebraExpr): string {
  const parts: string[] = [];
  if (expr.x2 !== 0) parts.push(`${expr.x2 >= 0 ? '+' : ''}${expr.x2}x^2`);
  if (expr.x !== 0) parts.push(`${expr.x >= 0 ? '+' : ''}${expr.x}x`);
  if (expr.constant !== 0) parts.push(`${expr.constant >= 0 ? '+' : ''}${expr.constant}`);
  return parts.length === 0 ? '+0' : parts.join('');
}

function parseFlatTerms(str: string): ParsedAlgebraExpr | null {
  if (!str) return null;
  // Clean doubled signs from expansion such as `+-` or `--`
  const cleaned = str.replace(/\+\+/g, '+').replace(/\+-/g, '-').replace(/-\+/g, '-').replace(/--/g, '+');
  const withLeading = cleaned[0] === '+' || cleaned[0] === '-' ? cleaned : `+${cleaned}`;

  const tokenRegex = /([+\-])(\d*x\^2|\d*x|\d+)/g;
  let matchedLength = 0;
  const result: ParsedAlgebraExpr = { x2: 0, x: 0, constant: 0 };

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(withLeading)) !== null) {
    if (match.index !== matchedLength) return null;
    matchedLength += match[0].length;

    const sign = match[1] === '-' ? -1 : 1;
    const body = match[2];

    if (body.endsWith('x^2')) {
      const coeffStr = body.slice(0, -3);
      const coeff = coeffStr === '' ? 1 : Number(coeffStr);
      if (!Number.isFinite(coeff)) return null;
      result.x2 += sign * coeff;
    } else if (body.endsWith('x')) {
      const coeffStr = body.slice(0, -1);
      const coeff = coeffStr === '' ? 1 : Number(coeffStr);
      if (!Number.isFinite(coeff)) return null;
      result.x += sign * coeff;
    } else {
      const val = Number(body);
      if (!Number.isFinite(val)) return null;
      result.constant += sign * val;
    }
  }

  if (matchedLength !== withLeading.length) return null;
  return result;
}

export function areSymbolicInputsEquivalent(
  userInput: string,
  target: ParsedAlgebraExpr
): {
  valid: boolean;
  parsed: ParsedAlgebraExpr | null;
  normalizedUserExpr: string;
  targetExpr: string;
  feedback: string;
} {
  const parsed = parseAlgebraExpression(userInput);
  const targetExpr = formatSummaryToExpression(target);

  if (!parsed) {
    return {
      valid: false,
      parsed: null,
      normalizedUserExpr: '',
      targetExpr,
      feedback:
        'Could not parse expression format. Use forms like x + 2, 2x + 8, or 5x (with the letter x).',
    };
  }

  const normalizedUserExpr = formatSummaryToExpression(parsed);
  const matches =
    parsed.x2 === target.x2 &&
    parsed.x === target.x &&
    parsed.constant === target.constant;

  if (!matches) {
    const partialDistributive =
      target.x2 === 0 &&
      parsed.x2 === 0 &&
      parsed.x === target.x &&
      parsed.x > 1 &&
      target.constant !== 0 &&
      target.constant % parsed.x === 0 &&
      parsed.constant === target.constant / parsed.x;

    return {
      valid: false,
      parsed,
      normalizedUserExpr,
      targetExpr,
      feedback: partialDistributive
        ? `Check the distributive property: the multiplier ${parsed.x} must multiply every term inside the parentheses (including the constant ${parsed.constant}), giving ${targetExpr} instead of ${normalizedUserExpr}.`
        : `The expression "${userInput.trim()}" simplifies to ${normalizedUserExpr}, which does not match the expected result (${targetExpr}). Check the variable coefficient and constant term.`,
    };
  }

  return {
    valid: true,
    parsed,
    normalizedUserExpr,
    targetExpr,
    feedback: `Correct! The expression ${userInput.trim()} is equivalent to ${targetExpr}.`,
  };
}

export function evaluateSubstitution(expr: ParsedAlgebraExpr, xValue: number): number {
  return expr.x2 * xValue * xValue + expr.x * xValue + expr.constant;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

function formatFractionCoeff(numerator: number, denominator: number, symbol: string, isFirst: boolean): string {
  if (numerator === 0) return '';
  const normDen = denominator < 0 ? -denominator : denominator;
  const normNum = denominator < 0 ? -numerator : numerator;
  const g = gcd(normNum, normDen);
  const n = Math.abs(normNum / g);
  const d = normDen / g;
  const negative = normNum < 0;
  const signPrefix = negative ? (isFirst ? '−' : ' − ') : isFirst ? '' : ' + ';

  if (d === 1) {
    if (symbol === '') return `${signPrefix}${n}`;
    return `${signPrefix}${n === 1 ? '' : n}${symbol}`;
  }

  if (symbol === '') {
    return `${signPrefix}${n}/${d}`;
  }
  return `${signPrefix}(${n}/${d})${symbol}`;
}

export function formatDividedSymbolicExpression(
  dividend: ParsedAlgebraExpr,
  divisor: number
): string {
  if (divisor === 0) return 'Undefined';
  const parts: string[] = [];
  const appendPart = (num: number, sym: string) => {
    if (num === 0) return;
    parts.push(formatFractionCoeff(num, divisor, sym, parts.length === 0));
  };
  appendPart(dividend.x2, 'x²');
  appendPart(dividend.x, 'x');
  appendPart(dividend.constant, '');
  return parts.length === 0 ? '0' : parts.join('');
}

export interface DistributiveMultiplicationPlan {
  originalNotation: string;
  intermediateNotation: string;
  finalExpression: string;
  result: ParsedAlgebraExpr;
  steps: string[];
  isNegativeMultiplier: boolean;
}

export function buildDistributiveMultiplication(
  multiplier: number,
  xCoeff: number,
  constant: number
): DistributiveMultiplicationPlan {
  const innerExpr = formatSummaryToExpression({ x2: 0, x: xCoeff, constant });
  const multPrefix = multiplier < 0 ? `−${Math.abs(multiplier)}` : `${multiplier}`;
  const originalNotation = `${multPrefix}(${innerExpr})`;

  const formatFactor = (v: number) => (v < 0 ? `(−${Math.abs(v)})` : `${v}`);
  const xPart =
    xCoeff === 1
      ? `${formatFactor(multiplier)} × x`
      : `${formatFactor(multiplier)} × ${formatFactor(xCoeff)}x`;

  const constAbs = Math.abs(constant);
  const constTermNotation =
    constant >= 0
      ? `+ ${formatFactor(multiplier)} × ${constAbs}`
      : `− ${formatFactor(multiplier)} × ${constAbs}`;

  const intermediateParts: string[] = [];
  if (xCoeff !== 0) intermediateParts.push(xPart);
  if (constant !== 0) intermediateParts.push(constTermNotation);
  const intermediateNotation = intermediateParts.join(' ').replace(/^\+\s*/, '');

  const result: ParsedAlgebraExpr = {
    x2: 0,
    x: multiplier * xCoeff,
    constant: multiplier * constant,
  };
  const finalExpression = formatSummaryToExpression(result);
  const isNegativeMultiplier = multiplier < 0;

  const steps: string[] = isNegativeMultiplier
    ? [
        `The negative sign in front of the parentheses (${multPrefix}) flips the sign of every term inside (${innerExpr}).`,
        `Distribute to each term: ${originalNotation} = ${intermediateNotation}.`,
        `Result with negative tiles: ${finalExpression} (${Math.abs(result.x)} × ${
          result.x < 0 ? '−x' : '+x'
        } tile(s) and ${Math.abs(result.constant)} × ${result.constant < 0 ? '−1' : '+1'} tile(s)).`,
      ]
    : [
        `Build ${multiplier} equal groups, each containing (${innerExpr}).`,
        `Multiply each term inside the parentheses: ${originalNotation} = ${intermediateNotation}.`,
        `Combine all tiles from the ${multiplier} groups: ${finalExpression}.`,
      ];

  return {
    originalNotation,
    intermediateNotation,
    finalExpression,
    result,
    steps,
    isNegativeMultiplier,
  };
}

export interface DivisionScalarResult {
  valid: boolean;
  canUseTiles: boolean;
  quotient?: ParsedAlgebraExpr;
  symbolicResult?: string;
  stepNotation?: string;
  reason: string;
}

export function divideExpressionByScalar(
  dividend: ParsedAlgebraExpr,
  divisor: number
): DivisionScalarResult {
  if (!Number.isFinite(divisor) || divisor === 0) {
    return {
      valid: false,
      canUseTiles: false,
      reason: 'Division by zero is undefined! The divisor must be a non-zero number.',
    };
  }

  const dividendExpr = formatSummaryToExpression(dividend);
  const hasMultipleTerms =
    [dividend.x2, dividend.x, dividend.constant].filter((v) => v !== 0).length > 1;
  const wrappedDividend = hasMultipleTerms ? `(${dividendExpr})` : dividendExpr;
  const divisorLabel = divisor < 0 ? `(−${Math.abs(divisor)})` : `${divisor}`;

  const termStepParts: string[] = [];
  if (dividend.x2 !== 0) {
    termStepParts.push(
      `${formatSummaryToExpression({ x2: dividend.x2, x: 0, constant: 0 })} ÷ ${divisorLabel}`
    );
  }
  if (dividend.x !== 0) {
    const xTerm = formatSummaryToExpression({ x2: 0, x: dividend.x, constant: 0 });
    termStepParts.push(
      dividend.constant === 0 && dividend.x2 === 0
        ? `(${dividend.x} ÷ ${divisorLabel})x`
        : `${xTerm} ÷ ${divisorLabel}`
    );
  }
  if (dividend.constant !== 0) {
    termStepParts.push(`${dividend.constant} ÷ ${divisorLabel}`);
  }

  const wholeDivisible =
    dividend.x2 % divisor === 0 &&
    dividend.x % divisor === 0 &&
    dividend.constant % divisor === 0;

  if (wholeDivisible) {
    const quotient: ParsedAlgebraExpr = {
      x2: dividend.x2 / divisor,
      x: dividend.x / divisor,
      constant: dividend.constant / divisor,
    };
    const symbolicResult = formatSummaryToExpression(quotient);
    const stepNotation = `${wrappedDividend} ÷ ${divisorLabel} = ${termStepParts.join(
      ' + '
    )} = ${symbolicResult}`;

    return {
      valid: true,
      canUseTiles: true,
      quotient,
      symbolicResult,
      stepNotation,
      reason: `Each term divides evenly by ${divisor} into ${divisor} equal tile groups: ${stepNotation}.`,
    };
  }

  const symbolicResult = formatDividedSymbolicExpression(dividend, divisor);
  const stepNotation = `${wrappedDividend} ÷ ${divisorLabel} = ${termStepParts.join(
    ' + '
  )} = ${symbolicResult}`;

  return {
    valid: true,
    canUseTiles: false,
    symbolicResult,
    stepNotation,
    reason: `Cannot split evenly into ${divisor} whole-tile groups (algebra tiles are never cut into partial pieces). In symbolic mode, the exact result is ${symbolicResult}.`,
  };
}

export function buildDivisionSteps(
  xCoeff: number,
  constCoeff: number,
  divisor: number
): DivisionScalarResult & { steps: string[] } {
  const res = divideExpressionByScalar({ x2: 0, x: xCoeff, constant: constCoeff }, divisor);
  if (!res.valid) {
    return {
      ...res,
      steps: [res.reason],
    };
  }
  if (res.canUseTiles) {
    return {
      ...res,
      steps: [
        `Prepare the set of tiles representing ${formatSummaryToExpression({
          x2: 0,
          x: xCoeff,
          constant: constCoeff,
        })}.`,
        `Distribute each tile type evenly into ${divisor} equal groups.`,
        res.stepNotation || res.reason,
      ],
    };
  }
  return {
    ...res,
    steps: [
      `Dividing by ${divisor} produces a fraction on the variable or unit tiles.`,
      'Algebra Tiles do not split individual tiles into fractions, so the division is shown symbolically:',
      res.stepNotation || res.symbolicResult || '',
    ],
  };
}

