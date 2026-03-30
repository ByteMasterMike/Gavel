/**
 * Strip common prompt-injection patterns before sending player text to an evaluator LLM.
 * Player content is still passed only as quoted data in the user message.
 */
export function sanitizeReasoningInput(text: string, maxLength = 12000): string {
  let t = text.slice(0, maxLength);
  const patterns = [
    /\bignore (all )?(previous|prior) instructions\b/gi,
    /\bsystem\s*:/gi,
    /\bassistant\s*:/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[\[INST\]\]/gi,
  ];
  for (const p of patterns) t = t.replace(p, "[redacted]");
  return t.trim();
}
