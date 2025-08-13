import React from "react";
import {
  ScaleKind,
  Position,
  Position5,
  PositionCAGED,
  POSITION_LABELS,
  NOTE_NAMES_SHARP,
  NOTE_NAMES_FLAT,
} from "./types";
import { Field } from "./Field";

interface ControlPanelProps {
  selectedKey: string;
  setSelectedKey: (key: string) => void;
  selectedScale: ScaleKind;
  setSelectedScale: (scale: ScaleKind) => void;
  selectedMode: "3nps" | "full" | "pent5" | "hex5" | "caged";
  setSelectedMode: (mode: "3nps" | "full" | "pent5" | "hex5" | "caged") => void;
  selectedPosition: Position;
  setSelectedPosition: (position: Position) => void;
  selectedBox: Position5;
  setSelectedBox: (box: Position5) => void;
  selectedCAGEDShape: PositionCAGED;
  setSelectedCAGEDShape: (shape: PositionCAGED) => void;
  labelMode: "note" | "degree";
  setLabelMode: (mode: "note" | "degree") => void;
  useFlats: boolean;
  setUseFlats: (useFlats: boolean) => void;
}

export function ControlPanel({
  selectedKey,
  setSelectedKey,
  selectedScale,
  setSelectedScale,
  selectedMode,
  setSelectedMode,
  selectedPosition,
  setSelectedPosition,
  selectedBox,
  setSelectedBox,
  selectedCAGEDShape,
  setSelectedCAGEDShape,
  labelMode,
  setLabelMode,
  useFlats,
  setUseFlats,
}: ControlPanelProps) {
  // Helper function to convert key to enharmonic equivalent
  const convertKeyToNotation = (key: string, toFlats: boolean): string => {
    // Mapping between sharps and flats
    const sharpToFlat: { [key: string]: string } = {
      "C#": "Db",
      "D#": "Eb",
      "F#": "Gb",
      "G#": "Ab",
      "A#": "Bb",
    };

    const flatToSharp: { [key: string]: string } = {
      Db: "C#",
      Eb: "D#",
      Gb: "F#",
      Ab: "G#",
      Bb: "A#",
    };

    if (toFlats && sharpToFlat[key]) {
      return sharpToFlat[key];
    } else if (!toFlats && flatToSharp[key]) {
      return flatToSharp[key];
    }

    return key; // Return unchanged if no conversion needed
  };

  const handleNotationToggle = () => {
    const newUseFlats = !useFlats;
    const convertedKey = convertKeyToNotation(selectedKey, newUseFlats);

    setUseFlats(newUseFlats);
    setSelectedKey(convertedKey);
  };

  return (
    <div className="bg-neutral-800 p-6 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Key Selection */}
        <Field label="Key">
          <div className="grid grid-cols-6 gap-2">
            {(useFlats ? NOTE_NAMES_FLAT : NOTE_NAMES_SHARP).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors w-full ${
                  selectedKey === key
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        </Field>

        {/* Scale Selection */}
        <Field label="Scale">
          {(["major", "minor"] as ScaleKind[]).map((scale) => (
            <button
              key={scale}
              onClick={() => setSelectedScale(scale)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors capitalize ${
                selectedScale === scale
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              }`}
            >
              {scale}
            </button>
          ))}
        </Field>

        {/* Mode Selection */}
        <Field label="Mode">
          {[
            { value: "caged", label: "CAGED" },
            { value: "pent5", label: "Pentatonic" },
            { value: "3nps", label: "3NPS" },
            { value: "hex5", label: "Hexatonic" },
            { value: "full", label: "Full Neck" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() =>
                setSelectedMode(
                  value as "3nps" | "full" | "pent5" | "hex5" | "caged"
                )
              }
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                selectedMode === value
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              }`}
            >
              {label}
            </button>
          ))}
        </Field>

        {/* Position Selection (for 3NPS mode) */}
        {selectedMode === "3nps" && (
          <Field label="Position">
            {POSITION_LABELS.map((label, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPosition(idx as Position)}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  selectedPosition === idx
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                {idx + 1}. {label}
              </button>
            ))}
          </Field>
        )}

        {/* Box Selection (for Pentatonic/Hexatonic modes) */}
        {(selectedMode === "pent5" || selectedMode === "hex5") && (
          <Field label="Box">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedBox(i as Position5)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedBox === i
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                Box {i + 1}
              </button>
            ))}
          </Field>
        )}

        {/* CAGED Shape Selection */}
        {selectedMode === "caged" && (
          <Field label="Shape">
            {[
              { label: "E Shape", index: 0 },
              { label: "D Shape", index: 1 },
              { label: "C Shape", index: 2 },
              { label: "A Shape", index: 3 },
              { label: "G Shape", index: 4 },
            ].map(({ label, index }) => (
              <button
                key={index}
                onClick={() => setSelectedCAGEDShape(index as PositionCAGED)}
                className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                  selectedCAGEDShape === index
                    ? "bg-emerald-500 text-white"
                    : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                }`}
              >
                {label}
              </button>
            ))}
          </Field>
        )}

        {/* Label Mode */}
        <Field label="Labels">
          {[
            { value: "note", label: "Notes" },
            { value: "degree", label: "Degrees" },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setLabelMode(value as "note" | "degree")}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                labelMode === value
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              }`}
            >
              {label}
            </button>
          ))}
        </Field>

        {/* Sharp/Flat Toggle */}
        <Field label="Notation">
          <button
            onClick={handleNotationToggle}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              useFlats
                ? "bg-emerald-500 text-white"
                : "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
            }`}
          >
            {useFlats ? "♭ Flats" : "♯ Sharps"}
          </button>
        </Field>
      </div>
    </div>
  );
}
