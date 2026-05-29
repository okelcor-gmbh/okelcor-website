// CRM-2: Client-side inquiry quality checker.
// Mirrors the server-side InquiryQualityService heuristics so rubbish is
// caught before hitting the network. Keep logic intentionally lenient —
// a short but valid message like "Need 200 Michelin 205/55R16 to Ghana"
// must always pass.

export type QualityCheckResult = {
  blocked: boolean;
  flags: string[];
  reason?: string;
};

// Matches standard tyre-size notation: 205/55R16, 295/80R22.5, etc.
const TYRE_SIZE_RE = /\d{3}\/\d{2}[RrBb]\d{1,3}(\.\d)?/;

const URL_RE = /https?:\/\/\S+|www\.[a-z0-9-]+\.[a-z]{2,}/gi;

const RUBBISH_WORDS = new Set([
  "test", "testing", "asdf", "qwerty", "zxcv", "hello", "hi", "hey",
  "yes", "no", "ok", "okay", "lol", "haha", "xyz", "abc", "hmm",
  "ugh", "nah", "na", "bla", "blah", "idk", "whatever",
]);

function isKeyboardSmash(word: string): boolean {
  if (word.length <= 3) return false;
  if (/^(asdf|qwer|zxcv|hjkl|yuio|bnm)/i.test(word)) return true;
  // All consonants, no vowels → very likely random mashing
  if (word.length > 5 && /^[bcdfghjklmnpqrstvwxyz]+$/i.test(word)) return true;
  return false;
}

/**
 * Check the quality of a quote inquiry's notes field.
 *
 * @param notes     The customer's free-text notes/message.
 * @param tyreItems The structured tyre-items rows from the form.
 */
export function checkInquiryQuality(
  notes: string,
  tyreItems?: { size: string; quantity: string }[]
): QualityCheckResult {
  const flags: string[] = [];
  const trimmed = notes.trim();

  // ── Immediate pass: tyre size present in structured rows ─────────────────
  if ((tyreItems ?? []).some((i) => TYRE_SIZE_RE.test(i.size.trim()))) {
    return { blocked: false, flags: [] };
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!trimmed) {
    return {
      blocked: true,
      flags: ["empty_message"],
      reason: "Please describe your tyre requirements.",
    };
  }

  // ── Too short (< 5 chars) ─────────────────────────────────────────────────
  if (trimmed.length < 5) {
    return {
      blocked: true,
      flags: ["too_short"],
      reason: "Please provide more detail about your requirements.",
    };
  }

  // ── Tyre size found inline in notes → legitimate ──────────────────────────
  if (TYRE_SIZE_RE.test(trimmed)) return { blocked: false, flags: [] };

  // ── URL spam (2+ links) ───────────────────────────────────────────────────
  const urls = trimmed.match(URL_RE) ?? [];
  if (urls.length >= 2) {
    flags.push("url_spam");
    return {
      blocked: true,
      flags,
      reason: "Please provide a clear business inquiry with tyre size, quantity, country, and contact details.",
    };
  }

  // ── All same character: "aaaaaa", "........", "!!!!!" ────────────────────
  if (/^(.)\1+$/.test(trimmed)) {
    flags.push("repeated_chars");
    return {
      blocked: true,
      flags,
      reason: "Please provide a clear quote request so our team can assist you.",
    };
  }

  // ── No alphanumeric at all ────────────────────────────────────────────────
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    flags.push("no_alphanumeric");
    return {
      blocked: true,
      flags,
      reason: "Please provide a clear quote request so our team can assist you.",
    };
  }

  // ── Tokenise ──────────────────────────────────────────────────────────────
  const words = trimmed.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);

  // ── Single pure number (e.g. "111111111") ─────────────────────────────────
  if (words.length === 1 && /^\d+$/.test(words[0])) {
    flags.push("only_number");
    return {
      blocked: true,
      flags,
      reason: "Please describe your tyre requirements.",
    };
  }

  // ── Single keyboard-smash word (e.g. "asdfasdf") ─────────────────────────
  if (words.length === 1 && isKeyboardSmash(words[0])) {
    flags.push("keyboard_smash");
    return {
      blocked: true,
      flags,
      reason: "Please provide a clear quote request so our team can assist you.",
    };
  }

  // ── Short message (1–2 words) where every word is rubbish ────────────────
  if (words.length <= 2) {
    const allRubbish = words.every(
      (w) => RUBBISH_WORDS.has(w) || isKeyboardSmash(w) || /^[a-z]{1,5}$/.test(w)
    );
    if (allRubbish) {
      flags.push("rubbish_text");
      return {
        blocked: true,
        flags,
        reason: "Please provide a clear quote request so our team can assist you.",
      };
    }
  }

  return { blocked: false, flags: [] };
}
