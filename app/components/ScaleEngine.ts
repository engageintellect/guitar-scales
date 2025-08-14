/** Scale generation logic for Scale Ninja */

import {
  ScaleKind,
  Position,
  Position5,
  PositionCAGED,
  SCALE_STEPS,
  MINOR_PENT_STEPS,
  MINOR_HEX_STEPS,
  MAJOR_HEX_STEPS,
  STRING_INTERVALS,
  OPEN_STRINGS_PC,
  ScalePoint,
} from "./types";

/* ------------------------------ helpers ------------------------------ */

export function keyToPc(key: string): number {
  const map: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };
  return map[key];
}

export function nearestFretForPcOnString(
  targetPc: number,
  stringIdx: number,
  approxFret: number
): number {
  const openPc = OPEN_STRINGS_PC[stringIdx];
  const base = (targetPc - openPc + 120) % 12; // 0..11
  let best = base,
    dist = Math.abs(base - approxFret);
  for (let k = -2; k <= 3; k++) {
    const f = base + 12 * k;
    if (f < 0) continue;
    const d = Math.abs(f - approxFret);
    if (d < dist) {
      dist = d;
      best = f;
    }
  }
  return best;
}

/* ------------------------------ Scale Builders ------------------------------ */

/** Build a single 3NPS shape for key/scale at modal offset `position` (0..6) */
export function build3NPS(
  keyPc: number,
  scale: ScaleKind,
  position: Position,
  anchorLowEFret = 5
): ScalePoint[] {
  const steps = SCALE_STEPS[scale];
  const degrees = Array.from({ length: 18 }, (_, j) => (position + j) % 7); // 6 strings × 3 notes

  // First note on low E close to anchor
  const firstPc = (keyPc + steps[degrees[0]]) % 12;
  const firstFret = nearestFretForPcOnString(firstPc, 0, anchorLowEFret);

  const out: ScalePoint[] = [];
  let expectedFret = firstFret;

  for (let j = 0; j < 18; j++) {
    const s = Math.floor(j / 3); // string index (0 = low E)
    const d = degrees[j];
    const pc = (keyPc + steps[d]) % 12;

    if (j > 0 && j % 3 === 0) {
      // move to next string: shift expected fret by string interval (approx position mapping)
      expectedFret -= STRING_INTERVALS[s - 1];
    } else if (j > 0) {
      // next note on same string: typically ~2 frets up
      expectedFret += 2;
    }

    const fret = nearestFretForPcOnString(pc, s, expectedFret);
    expectedFret = fret;
    out.push({ string: s, fret, pc, degreeIdx: d });
  }

  return out;
}

/** Generic builder: N-notes-per-string shape walking scale degrees in order */
export function buildNPerString(
  keyPc: number,
  steps: number[],
  startDeg: number,
  notesPerString: number,
  anchorLowEFret = 5
): ScalePoint[] {
  const totalNotes = 6 * notesPerString;
  const firstPc = (keyPc + steps[startDeg]) % 12;
  const firstFret = nearestFretForPcOnString(firstPc, 0, anchorLowEFret);
  const out: ScalePoint[] = [];
  let expectedFret = firstFret;

  for (let j = 0; j < totalNotes; j++) {
    const s = Math.floor(j / notesPerString);
    const d = (startDeg + j) % steps.length;
    const pc = (keyPc + steps[d]) % 12;
    if (j > 0 && j % notesPerString === 0) {
      expectedFret -= STRING_INTERVALS[s - 1];
    } else if (j > 0) {
      expectedFret += 2;
    }
    const fret = nearestFretForPcOnString(pc, s, expectedFret);
    expectedFret = fret;
    out.push({ string: s, fret, pc, degreeIdx: d });
  }
  return out;
}

/** Pentatonic 5-box. Box 1 starts at root on low E for minor, or relative minor root for major. */
export function buildPent5(keyPc: number, box: Position5, scale: ScaleKind = "minor", anchorLowEFret = 5): ScalePoint[] {
  // For major pentatonic, use the relative minor (3 semitones down)
  // This way C major pentatonic uses A minor pentatonic shapes
  const effectiveKeyPc = scale === "major" ? (keyPc + 9) % 12 : keyPc;
  
  // Check for problematic key/box combinations that generate wide spans
  const isProblematicCase = 
    (effectiveKeyPc === 1 && box === 1) ||  // C#/Db Box 2
    (effectiveKeyPc === 6 && box === 4) ||  // F#/Gb Box 5
    (effectiveKeyPc === 11 && box === 2);   // B Box 3
  
  // Use higher anchor for problematic cases to avoid open strings
  const adjustedAnchor = isProblematicCase ? anchorLowEFret + 5 : anchorLowEFret;
  
  const startDeg = (0 + box) % MINOR_PENT_STEPS.length;
  return buildNPerString(effectiveKeyPc, MINOR_PENT_STEPS, startDeg, 2, adjustedAnchor);
}

/** Hexatonic (pent + extra note) 5-box. Box 1 starts at root on low E for minor, or relative minor root for major.
 *  Implementation: take the pentatonic box and add the extra degree only where
 *  it naturally falls within the box's fret range (not forced onto every string).
 */
export function buildHex5(keyPc: number, box: Position5, scale: ScaleKind = "minor", anchorLowEFret = 5): ScalePoint[] {
  // For major hexatonic, use the relative minor (3 semitones down)
  // This way C major hexatonic uses A minor hexatonic shapes
  const effectiveKeyPc = scale === "major" ? (keyPc + 9) % 12 : keyPc;
  
  // Check for problematic key/box combinations that generate wide spans
  const isProblematicCase = 
    (effectiveKeyPc === 1 && box === 1) ||  // C#/Db Box 2
    (effectiveKeyPc === 6 && box === 4) ||  // F#/Gb Box 5
    (effectiveKeyPc === 11 && box === 2);   // B Box 3
  
  // Use higher anchor for problematic cases to avoid open strings
  const adjustedAnchor = isProblematicCase ? anchorLowEFret + 5 : anchorLowEFret;
  
  // Base pent box (always use minor since we're using effectiveKeyPc)
  const pent = buildPent5(effectiveKeyPc, box, "minor", adjustedAnchor);

  // Overall box fret range
  const boxMin = Math.min(...pent.map((p) => p.fret));
  let boxMax = Math.max(...pent.map((p) => p.fret));
  
  // Constrain the box range to prevent excessive spans
  const maxSpan = 8; // Maximum allowed fret span
  if (boxMax - boxMin > maxSpan) {
    boxMax = boxMin + maxSpan;
  }

  // Only extend range for Box 1 to include the 9th fret B on D string
  if (box === 0) {
    boxMax += 1; // minimal extension just for Box 1
  }

  // For minor hexatonic: add the 2nd degree
  // For major hexatonic: add the 4th degree (but we're using relative minor shapes, so still add 2nd of effective key)
  const targetPc = (effectiveKeyPc + 2) % 12; // the 2nd degree of the effective key
  const added: { string: number; fret: number; pc: number }[] = [];

  // For each string, check if the 2nd degree falls within the box range
  for (let s = 0; s < 6; s++) {
    const openPc = OPEN_STRINGS_PC[s];
    const base = (targetPc - openPc + 120) % 12; // first occurrence >=0

    // Find all possible fret positions for the 2nd degree on this string
    for (let k = 0; k <= 3; k++) {
      const fret = base + 12 * k;
      if (fret > 24) break;

      // Only add if it falls within the pentatonic box range
      if (fret >= boxMin && fret <= boxMax) {
        // Check if this note isn't already in the pentatonic set
        const alreadyExists = pent.some(
          (p) => p.string === s && p.fret === fret
        );
        if (!alreadyExists) {
          added.push({ string: s, fret, pc: targetPc });
          break; // Only add one occurrence per string
        }
      }
    }
  }

  // Choose the appropriate hex steps based on scale type
  const hexSteps = scale === "major" ? MAJOR_HEX_STEPS : MINOR_HEX_STEPS;
  const originalKeyPc = keyPc; // Keep original key for interval calculation
  
  // Merge and remap degreeIdx to hex indices for all points
  const merged = [
    ...pent.map((p) => {
      const interval = (p.pc - originalKeyPc + 12) % 12;
      const idx = hexSteps.indexOf(interval);
      return { ...p, degreeIdx: idx >= 0 ? idx : 0 };
    }),
    ...added.map((q) => {
      const interval = (q.pc - originalKeyPc + 12) % 12;
      const idx = hexSteps.indexOf(interval);
      return {
        string: q.string,
        fret: q.fret,
        pc: q.pc,
        degreeIdx: idx >= 0 ? idx : 1,
      };
    }),
  ];

  return merged;
}

/** Enhanced CAGED system - shows both chord shapes (triad) and pentatonic scale notes */
export function buildCAGED(keyPc: number, scale: ScaleKind, shape: PositionCAGED): ScalePoint[] {
  // Get the pentatonic notes using the correct scale type
  const cagedToBoxMapping = {
    0: { box: 0, anchorFret: 0 },   // Shape 1 (E-shape) = Box 1 at open position
    1: { box: 1, anchorFret: 3 },   // Shape 2 (D-shape) = Box 2 at 3rd fret
    2: { box: 2, anchorFret: 5 },   // Shape 3 (C-shape) = Box 3 at 5th fret
    3: { box: 3, anchorFret: 7 },   // Shape 4 (A-shape) = Box 4 at 7th fret
    4: { box: 4, anchorFret: 10 }   // Shape 5 (G-shape) = Box 5 at 10th fret
  };
  
  const mapping = cagedToBoxMapping[shape];
  // Use the correct scale type for pentatonic patterns
  const pentNotes = buildPent5(keyPc, mapping.box as Position5, scale, mapping.anchorFret);
  
  // Define chord tone intervals based on scale type
  const triadIntervals = scale === "major" 
    ? [0, 4, 7]  // Major triad: root, major 3rd, perfect 5th
    : [0, 3, 7]; // Minor triad: root, minor 3rd, perfect 5th
  
  return pentNotes.map(note => {
    const interval = (note.pc - keyPc + 12) % 12;
    const isChordTone = triadIntervals.includes(interval);
    
    return {
      ...note,
      isChordTone // Add flag to identify chord tones vs scale tones
    };
  });
}

/** Build full-neck set (all positions) */
export function buildFullNeck(
  keyPc: number,
  scale: ScaleKind,
  maxFret = 21
): ScalePoint[] {
  const steps = SCALE_STEPS[scale];
  const out: ScalePoint[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= maxFret; f++) {
      const pc = (OPEN_STRINGS_PC[s] + f) % 12;
      const interval = (pc - keyPc + 12) % 12;
      const degreeIdx = steps.indexOf(interval);
      if (degreeIdx >= 0) {
        out.push({ string: s, fret: f, pc, degreeIdx });
      }
    }
  }
  return out;
}
