"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { GamePhase, PublicCasePayload } from "@/types";
import { GAME_PHASES } from "@/types";

type State = {
  phase: GamePhase;
  caseData: PublicCasePayload | null;
  startedAt: number | null;
  flaggedIds: Set<string>;
  starredIds: Set<string>;
  openedDocIds: Set<string>;
  citedPrecedentIds: string[];
  hintsUsed: number;
  verdict: string;
  verdictFlips: number;
  /** Last non-empty verdict selection (for indecision counting). */
  prevVerdict: string;
};

type Action =
  | { type: "LOAD_CASE"; payload: PublicCasePayload }
  | { type: "SET_PHASE"; payload: GamePhase }
  | { type: "NEXT_PHASE" }
  | { type: "TOGGLE_FLAG"; id: string }
  | { type: "TOGGLE_STAR"; id: string }
  | { type: "MARK_OPENED"; id: string }
  | { type: "TOGGLE_PRECEDENT"; id: string; max: number }
  | { type: "USE_HINT" }
  | { type: "SET_VERDICT"; value: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "LOAD_CASE":
      return {
        ...state,
        caseData: action.payload,
        startedAt: Date.now(),
        flaggedIds: new Set(),
        starredIds: new Set(),
        openedDocIds: new Set(),
        citedPrecedentIds: [],
        hintsUsed: 0,
        verdict: "",
        verdictFlips: 0,
        prevVerdict: "",
        phase: "briefing",
      };
    case "SET_PHASE":
      return { ...state, phase: action.payload };
    case "NEXT_PHASE": {
      const i = GAME_PHASES.indexOf(state.phase);
      const next = GAME_PHASES[Math.min(i + 1, GAME_PHASES.length - 1)]!;
      return { ...state, phase: next };
    }
    case "TOGGLE_FLAG": {
      const n = new Set(state.flaggedIds);
      if (n.has(action.id)) n.delete(action.id);
      else n.add(action.id);
      return { ...state, flaggedIds: n };
    }
    case "TOGGLE_STAR": {
      const n = new Set(state.starredIds);
      if (n.has(action.id)) n.delete(action.id);
      else n.add(action.id);
      return { ...state, starredIds: n };
    }
    case "MARK_OPENED": {
      const n = new Set(state.openedDocIds);
      n.add(action.id);
      return { ...state, openedDocIds: n };
    }
    case "TOGGLE_PRECEDENT": {
      const has = state.citedPrecedentIds.includes(action.id);
      if (has) {
        return {
          ...state,
          citedPrecedentIds: state.citedPrecedentIds.filter((x) => x !== action.id),
        };
      }
      if (state.citedPrecedentIds.length >= action.max) return state;
      return { ...state, citedPrecedentIds: [...state.citedPrecedentIds, action.id] };
    }
    case "USE_HINT":
      return { ...state, hintsUsed: Math.min(2, state.hintsUsed + 1) };
    case "SET_VERDICT": {
      const v = action.value;
      let flips = state.verdictFlips;
      if (state.prevVerdict && v && state.prevVerdict !== v) flips += 1;
      const prevVerdict = v || state.prevVerdict;
      return { ...state, verdict: v, verdictFlips: flips, prevVerdict };
    }
    default:
      return state;
  }
}

const initial: State = {
  phase: "briefing",
  caseData: null,
  startedAt: null,
  flaggedIds: new Set(),
  starredIds: new Set(),
  openedDocIds: new Set(),
  citedPrecedentIds: [],
  hintsUsed: 0,
  verdict: "",
  verdictFlips: 0,
  prevVerdict: "",
};

type Ctx = {
  state: State;
  loadCase: (c: PublicCasePayload) => void;
  setPhase: (p: GamePhase) => void;
  nextPhase: () => void;
  toggleFlag: (id: string) => void;
  toggleStar: (id: string) => void;
  markOpened: (id: string) => void;
  togglePrecedent: (id: string) => void;
  bumpHintsUsed: () => void;
  setVerdict: (v: string) => void;
};

const CaseSessionContext = createContext<Ctx | null>(null);

export function CaseSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const loadCase = useCallback((payload: PublicCasePayload) => {
    dispatch({ type: "LOAD_CASE", payload });
  }, []);

  const setPhase = useCallback((p: GamePhase) => dispatch({ type: "SET_PHASE", payload: p }), []);

  const nextPhase = useCallback(() => dispatch({ type: "NEXT_PHASE" }), []);

  const toggleFlag = useCallback((id: string) => dispatch({ type: "TOGGLE_FLAG", id }), []);

  const toggleStar = useCallback((id: string) => dispatch({ type: "TOGGLE_STAR", id }), []);

  const markOpened = useCallback((id: string) => dispatch({ type: "MARK_OPENED", id }), []);

  const togglePrecedent = useCallback((id: string) => {
    const max = stateRef.current.caseData?.maxPrecedents ?? 5;
    dispatch({ type: "TOGGLE_PRECEDENT", id, max });
  }, []);

  const bumpHintsUsed = useCallback(() => dispatch({ type: "USE_HINT" }), []);

  const setVerdict = useCallback((v: string) => dispatch({ type: "SET_VERDICT", value: v }), []);

  const value = useMemo(
    () => ({
      state,
      loadCase,
      setPhase,
      nextPhase,
      toggleFlag,
      toggleStar,
      markOpened,
      togglePrecedent,
      bumpHintsUsed,
      setVerdict,
    }),
    [
      state,
      loadCase,
      setPhase,
      nextPhase,
      toggleFlag,
      toggleStar,
      markOpened,
      togglePrecedent,
      bumpHintsUsed,
      setVerdict,
    ],
  );

  return <CaseSessionContext.Provider value={value}>{children}</CaseSessionContext.Provider>;
}

export function useCaseSession() {
  const ctx = useContext(CaseSessionContext);
  if (!ctx) throw new Error("useCaseSession must be used within CaseSessionProvider");
  return ctx;
}
