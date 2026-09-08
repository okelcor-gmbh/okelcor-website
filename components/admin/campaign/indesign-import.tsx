"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, FileArchive, Image as ImageIcon,
  Info, Loader2, Monitor, MousePointerClick, Smartphone, Upload, X,
} from "lucide-react";
import type { CampaignImportResult } from "@/lib/admin-api";
import { PREVIEW_WIDTH } from "@/lib/campaign-design";

/**
 * Importing a design the marketers made in InDesign.
 *
 * ── The framing is the feature ────────────────────────────────────────────────
 * This screen never claims to have *converted* their design. An InDesign HTML5
 * export is an iframe on a fixed print canvas where every element is absolutely
 * positioned under a transform and every individual word is its own span; email
 * has no mechanism for any of that, in Outlook least of all. What crosses over
 * is the imagery, the copy, the reading order and the colours — which lands
 * close, and the marketer finishes it in the editor.
 *
 * So every label here says "imported, review it", never "converted". Someone
 * will hold this up next to InDesign on a second monitor within a week; if the
 * screen promised a copy, that comparison makes it a bug report instead of the
 * starting point it actually is.
 *
 * ── Colour ───────────────────────────────────────────────────────────────────
 * Nothing in this component touches colour. The importer deliberately overrides
 * an illegible recovered palette with the house theme, because InDesign sets
 * type white to sit on a full-bleed photo and that photo cannot come across —
 * copying it faithfully sends white text on a white page, an email that arrives
 * blank and passes every check that isn't a human looking at it. Reapplying the
 * export's colours here would put that bug straight back.
 */

const MAX_BYTES = 50 * 1024 * 1024; // API limit: max:51200 KB

/**
 * Vercel caps a Function's request body at 4.5 MB and answers 413
 * FUNCTION_PAYLOAD_TOO_LARGE — a documented platform limit that applies to App
 * Router route handlers and cannot be raised from application code
 * (`experimental.serverActions.bodySizeLimit` covers Server Actions only).
 *
 * So the API accepts 50 MB but this site cannot forward more than ~4.5 MB of it,
 * and an InDesign export carrying photographs passes that easily. Warned about
 * from 4 MB, never blocked: the limit is Vercel's, not the API's, so a local or
 * self-hosted deployment really does take the full 50 MB, and refusing a file
 * the server would have accepted is its own bug.
 */
const HOSTING_RISK_BYTES = 4 * 1024 * 1024;

/**
 * What Vercel returns when the body exceeded the cap above.
 *
 * The advice is specific because the importer downscales every image to 2000px
 * on the longest side and re-encodes at JPEG 90 — anything above that is
 * discarded on the way in. Exporting smaller is therefore not a quality
 * compromise: above that threshold a bigger export produces a byte-identical
 * email, it just spends upload budget to do it.
 */
const PAYLOAD_TOO_LARGE_MESSAGE =
  "This site couldn't forward an archive that large — uploads through it are capped at " +
  "about 4.5 MB. Re-export from InDesign with Publish Online set to Medium (150 ppi): " +
  "the import reduces every image to 2000px anyway, so the email you get is identical, " +
  "just from a much smaller file.";

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A warning that names the missing call to action, which fires on every import. */
function isCtaWarning(w: string): boolean {
  return /call-to-action|call to action/i.test(w);
}

function blockSummary(block: Record<string, unknown>): string {
  const first = ["text", "heading", "title", "content", "body", "caption", "label", "url", "image_url"]
    .map((k) => block[k])
    .find((v) => typeof v === "string" && v.trim() !== "") as string | undefined;
  if (!first) return "";
  const flat = first.replace(/\s+/g, " ").trim();
  return flat.length > 90 ? `${flat.slice(0, 90)}…` : flat;
}

function prettyType(type: string): string {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Step = "upload" | "review";

export default function InDesignImport({
  onClose,
  onImported,
}: {
  onClose: () => void;
  /** Fires once a template is genuinely saved, with its blocks ready to use. */
  onImported: (result: CampaignImportResult, useNow: boolean) => void;
}) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [result, setResult] = useState<CampaignImportResult | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [blockErrors, setBlockErrors] = useState<string[]>([]);

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [savedId, setSavedId]         = useState<number | null>(null);
  const [mobile, setMobile]           = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    setBlockErrors([]);
    if (!f) { setFile(null); return; }
    if (!f.name.toLowerCase().endsWith(".zip")) {
      setError("That isn't a .zip. Zip the whole folder InDesign exported, then upload the zip.");
      setFile(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`That archive is ${fmtSize(f.size)}. The limit is 50 MB — export from InDesign at a lower image resolution.`);
      setFile(null);
      return;
    }
    setFile(f);
    // A sensible starting name; the marketer can change it before saving.
    if (!name) setName(f.name.replace(/\.zip$/i, "").replace(/[_-]+/g, " ").trim().slice(0, 150));
  }

  /**
   * One call does both jobs. `dry_run` reads the design and saves nothing, which
   * is what makes "review it before sending" real rather than a slogan.
   *
   * Reviewing repeatedly is cheap: the upstream keys each conversion on the
   * archive's own content hash (cached 2h), so the same bytes reuse the same
   * conversion and the same Media Library rows however many times they are
   * reviewed and whoever uploads them — while edited bytes convert afresh, so an
   * edit is never served a stale design. This screen still doesn't re-read on its
   * own, but only because a re-read should be someone's decision, not because it
   * would duplicate anything.
   */
  async function callImport(dryRun: boolean) {
    if (!file) return;
    setError(null);
    setBlockErrors([]);
    if (dryRun) setReading(true); else setSaving(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      if (dryRun) {
        fd.append("dry_run", "true");
      } else {
        if (!name.trim()) {
          setError("Give this design a name so it can be found again.");
          return;
        }
        fd.append("name", name.trim().slice(0, 150));
        if (description.trim()) fd.append("description", description.trim().slice(0, 500));
      }

      const res  = await fetch("/api/admin/campaign-templates/import", { method: "POST", body: fd });

      // 413 is answered by the hosting platform before any of our code runs, so
      // the body is its error page rather than our JSON — handled on status
      // alone, or this surfaces as the generic "could not be read" and sends the
      // marketer off re-exporting to fix a problem that isn't in their file.
      if (res.status === 413) {
        setError(PAYLOAD_TOO_LARGE_MESSAGE);
        return;
      }

      const json = await res.json().catch(() => ({})) as {
        data?: CampaignImportResult;
        message?: string;
        code?: string;
        errors?: { blocks?: string[] };
      };

      if (!res.ok) {
        // The upstream's messages are already written for the person who
        // uploaded the file — show them verbatim rather than replacing them
        // with something generic and less useful.
        if (json.code === "invalid_blocks") {
          setError(json.message ?? "The design was read, but it could not be turned into a valid campaign.");
          setBlockErrors(json.errors?.blocks ?? []);
        } else {
          setError(json.message ?? "That export could not be read.");
        }
        return;
      }

      if (!json.data) {
        setError("The server returned an empty result. Try the import again.");
        return;
      }

      setResult(json.data);
      if (json.data.saved && typeof json.data.template_id === "number") {
        setSavedId(json.data.template_id);
      }
      setStep("review");
    } catch {
      setError("Network error while uploading. Check your connection and try again.");
    } finally {
      setReading(false);
      setSaving(false);
    }
  }

  const warnings   = result?.warnings ?? [];
  const ctaWarning = warnings.find(isCtaWarning);
  const otherWarnings = warnings.filter((w) => !isCtaWarning(w));
  const media  = result?.media ?? [];
  const blocks = result?.blocks ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center gap-3 border-b border-black/[0.07] px-5 py-4">
          {step === "review" && !savedId && (
            <button
              type="button"
              onClick={() => { setStep("upload"); setResult(null); }}
              className="rounded-lg p-1.5 text-[#5c5e62] transition hover:bg-[#f0f2f5] hover:text-[#171a20]"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-[0.95rem] font-bold text-[#171a20]">
              {step === "upload"
                ? "Import a design from InDesign"
                : savedId
                  ? "Design saved"
                  : "Design imported — review it before sending"}
            </h2>
            <p className="mt-0.5 text-[0.75rem] text-[#5c5e62]">
              {step === "upload"
                ? "Upload the exported folder, zipped. Nothing is saved until you choose to save it."
                : savedId
                  ? "It's an ordinary design now — open it in the editor whenever you like."
                  : "Nothing has been saved yet. This is what the email will actually look like."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={reading || saving}
            className="ml-auto rounded-lg p-1.5 text-[#8c8f94] transition hover:bg-[#f0f2f5] hover:text-[#171a20] disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        {/* ══════════════════════════ STEP 1 — UPLOAD ══════════════════════════ */}
        {step === "upload" && (
          <div className="flex-1 overflow-auto p-5">
            <div className="mx-auto max-w-2xl space-y-4">

              {/* Set the expectation before the upload, not after the result. */}
              <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-[0.8rem] leading-relaxed text-blue-900">
                <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <p className="font-semibold">This brings your design across as a starting point.</p>
                  <p className="mt-1">
                    The pictures, the words, their order and the colours all come over, rendered so
                    they work in Outlook and on phones. The exact InDesign layout can&apos;t — email has
                    no way to place text over a full-bleed photo or use your display typeface. You
                    finish it in the editor, which is quick, because the content is already there.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[0.78rem] font-bold text-[#171a20]">
                  Zip the whole exported folder
                </p>
                <p className="mb-2 text-[0.78rem] leading-relaxed text-[#5c5e62]">
                  In InDesign use <strong>File → Publish Online (HTML)</strong>. Then zip the entire
                  folder it produces — not just <code className="rounded bg-[#f0f2f5] px-1 py-0.5 font-mono text-[0.72rem]">index.html</code>.
                  The images and colours live in a{" "}
                  <code className="rounded bg-[#f0f2f5] px-1 py-0.5 font-mono text-[0.72rem]">publication-web-resources</code>{" "}
                  folder beside it, and without it there is nothing to import.
                </p>
                {/* Named explicitly because it is free: the importer caps images at
                    2000px / JPEG 90, so a larger export produces the same email
                    from a bigger file — and a bigger file is the only thing that
                    runs into the upload ceiling. */}
                <p className="mb-3 text-[0.78rem] leading-relaxed text-[#5c5e62]">
                  In that dialog, <strong>Medium (150 ppi)</strong> is enough. Images are reduced to
                  2000px on their longest side during the import, so a higher-resolution export
                  gives you exactly the same email from a much larger file.
                </p>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                    dragOver
                      ? "border-[#f4511e] bg-[#f4511e]/[0.04]"
                      : "border-black/[0.14] bg-[#fafafa]"
                  }`}
                >
                  <FileArchive size={26} className={dragOver ? "text-[#f4511e]" : "text-[#8c8f94]"} strokeWidth={1.7} />
                  {file ? (
                    <>
                      <p className="mt-2.5 text-[0.85rem] font-semibold text-[#171a20]">{file.name}</p>
                      <p className="mt-0.5 text-[0.75rem] tabular-nums text-[#5c5e62]">{fmtSize(file.size)}</p>
                      <button
                        type="button"
                        onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                        className="mt-2 text-[0.75rem] font-semibold text-[#5c5e62] underline-offset-2 hover:text-[#171a20] hover:underline"
                      >
                        Choose a different file
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-2.5 text-[0.85rem] text-[#5c5e62]">
                        Drag the zip here, or{" "}
                        <button
                          type="button"
                          onClick={() => inputRef.current?.click()}
                          className="font-semibold text-[#f4511e] underline-offset-2 hover:underline"
                        >
                          browse for it
                        </button>
                      </p>
                      <p className="mt-1 text-[0.72rem] text-[#8c8f94]">.zip · up to 50 MB</p>
                    </>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".zip,application/zip"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </div>

                {file && file.size > HOSTING_RISK_BYTES && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[0.78rem] text-amber-800">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>
                      This archive is {fmtSize(file.size)}, and uploads through this site are capped
                      at about 4.5 MB, so it will probably be refused before it reaches the importer.
                      Re-export with <strong>Publish Online set to Medium (150 ppi)</strong> — images
                      are reduced to 2000px during the import either way, so you lose nothing in the
                      email and the file gets far smaller. A typical export lands around 1.6 MB.
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[0.8rem] text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p>{error}</p>
                    {blockErrors.length > 0 && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                        {blockErrors.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => callImport(true)}
                disabled={!file || reading}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4511e] px-5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d8410f] disabled:opacity-50"
              >
                {reading
                  ? <><Loader2 size={14} className="animate-spin" /> Reading the design…</>
                  : <><Upload size={14} strokeWidth={2.2} /> Read the design</>
                }
              </button>
              <p className="text-[0.72rem] text-[#8c8f94]">
                This only reads it, so you can see the result first. Nothing is saved yet.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════ STEP 2/3 — REVIEW + SAVE ══════════════════════ */}
        {step === "review" && result && (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 lg:flex-row">

              {/* ── Left: what came across ── */}
              <div className="flex w-full flex-col gap-3 lg:max-w-sm">

                {savedId && (
                  <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[0.8rem] text-emerald-800">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                    <span>
                      Saved as <strong>{result.name}</strong>. It&apos;s in your saved designs now, and
                      the pictures are in the Media Library for the next campaign.
                    </span>
                  </div>
                )}

                {/* The one thing someone must do after an import. InDesign
                    carries no links, so there is never a button — this is not an
                    edge case, it fires every single time. */}
                {ctaWarning && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5">
                    <div className="flex items-start gap-2">
                      <MousePointerClick size={15} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-[0.82rem] font-bold text-amber-900">
                          Add a button before you send this
                        </p>
                        <p className="mt-1 text-[0.78rem] leading-relaxed text-amber-800">
                          {ctaWarning}
                        </p>
                        <p className="mt-1.5 text-[0.75rem] text-amber-700">
                          InDesign files carry no links, so nothing can be carried over. Add a Button
                          block in the editor and point it where this campaign should send people.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {otherWarnings.length > 0 && (
                  <div className="rounded-xl border border-black/[0.07] bg-[#fafafa] p-3.5">
                    <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                      Worth knowing
                    </p>
                    <ul className="space-y-2">
                      {otherWarnings.map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-[0.78rem] leading-relaxed text-[#171a20]">
                          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Block list */}
                <div className="rounded-xl border border-black/[0.07] bg-white">
                  <p className="border-b border-black/[0.06] px-3.5 py-2.5 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                    {blocks.length} block{blocks.length === 1 ? "" : "s"} recovered
                  </p>
                  <ol className="max-h-64 divide-y divide-black/[0.05] overflow-auto">
                    {blocks.map((b, i) => {
                      const summary = blockSummary(b);
                      return (
                        <li key={i} className="px-3.5 py-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[0.68rem] tabular-nums text-[#b0b3b8]">{i + 1}</span>
                            <span className="text-[0.78rem] font-semibold text-[#171a20]">
                              {prettyType(b.type)}
                            </span>
                          </div>
                          {summary && (
                            <p className="mt-0.5 pl-5 text-[0.75rem] leading-snug text-[#5c5e62]">{summary}</p>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {media.length > 0 && (
                  <div className="rounded-xl border border-black/[0.07] bg-white p-3.5">
                    <p className="mb-2 flex items-center gap-1.5 text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">
                      <ImageIcon size={12} /> {media.length} picture{media.length === 1 ? "" : "s"} in the Media Library
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {media.slice(0, 12).map((m) => (
                        // Plain <img>: these are absolute URLs on the API host and
                        // this is a 40px admin thumbnail — routing it through the
                        // image optimiser would need another remotePatterns entry
                        // for no benefit at this size.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={m.media_id}
                          src={m.url}
                          alt={m.filename ?? ""}
                          title={m.filename ?? undefined}
                          className="h-10 w-10 rounded border border-black/[0.08] object-cover"
                        />
                      ))}
                      {media.length > 12 && (
                        <span className="flex h-10 items-center px-1 text-[0.72rem] text-[#8c8f94]">
                          +{media.length - 12}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[0.72rem] leading-snug text-[#8c8f94]">
                      Reusable from the picker in any future campaign — no second import needed.
                    </p>
                  </div>
                )}

                {result.source && (
                  <p className="text-[0.72rem] text-[#8c8f94]">
                    Read from <span className="font-mono">{result.source.document}</span>
                    {result.source.text_frames != null && ` · ${result.source.text_frames} text frames`}
                    {result.source.images_seen != null && ` · ${result.source.images_seen} images seen`}
                  </p>
                )}
              </div>

              {/* ── Right: the real email ── */}
              <div className="flex min-h-[380px] flex-1 flex-col overflow-hidden rounded-xl border border-black/[0.07] bg-white">
                <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#f5f5f5] px-4 py-2.5">
                  <h3 className="text-[0.83rem] font-bold text-[#171a20]">How the email will look</h3>
                  <span className="font-mono text-[0.7rem] text-[#8c8f94]">
                    {mobile ? "Mobile" : "Desktop"} · {mobile ? PREVIEW_WIDTH.mobile : PREVIEW_WIDTH.desktop}px
                  </span>
                  <div className="ml-auto flex items-center gap-0.5 rounded-full bg-white p-0.5">
                    <button
                      type="button" onClick={() => setMobile(false)} title="Desktop"
                      className={`rounded-full p-1.5 transition ${!mobile ? "bg-[#171a20] text-white" : "text-[#5c5e62] hover:bg-[#f0f2f5]"}`}
                    >
                      <Monitor size={13} />
                    </button>
                    <button
                      type="button" onClick={() => setMobile(true)} title="Mobile"
                      className={`rounded-full p-1.5 transition ${mobile ? "bg-[#171a20] text-white" : "text-[#5c5e62] hover:bg-[#f0f2f5]"}`}
                    >
                      <Smartphone size={13} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-1 justify-center overflow-auto bg-[#f0f2f5] p-4">
                  {result.preview_html ? (
                    // Sandboxed with no allow-* for the same reason as the live
                    // preview: this is a whole document with its own styles, and
                    // it came out of an untrusted upload.
                    <iframe
                      key={mobile ? "m" : "d"}
                      title="Imported design preview"
                      srcDoc={result.preview_html}
                      sandbox=""
                      className="h-full w-full rounded-lg border border-black/[0.06] bg-white"
                      // Real width, not a scaled desktop render — see PREVIEW_WIDTH.
                      style={{ maxWidth: mobile ? PREVIEW_WIDTH.mobile : PREVIEW_WIDTH.desktop, minHeight: 360 }}
                    />
                  ) : (
                    <p className="self-center text-[0.83rem] text-[#8c8f94]">
                      No preview came back for this design.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer: save, or use it ── */}
            <div className="shrink-0 border-t border-black/[0.07] bg-[#fafafa] px-5 py-4">
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[0.8rem] text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <div>
                    <p>{error}</p>
                    {blockErrors.length > 0 && (
                      <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
                        {blockErrors.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {savedId ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onImported(result, true)}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4511e] px-5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d8410f]"
                  >
                    Use this design now
                  </button>
                  <button
                    type="button"
                    onClick={() => onImported(result, false)}
                    className="h-10 rounded-full border border-black/[0.12] bg-white px-5 text-[0.85rem] font-semibold text-[#5c5e62] transition hover:border-black/25 hover:text-[#171a20]"
                  >
                    Save for later
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label htmlFor="imp-name" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                      Design name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="imp-name"
                      value={name}
                      maxLength={150}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Fuel Eco Tech launch"
                      className="h-10 w-full rounded-lg border border-black/[0.12] bg-white px-3 text-[0.85rem] text-[#171a20] outline-none placeholder:text-[#b0b3b8] focus:border-[#f4511e]"
                    />
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <label htmlFor="imp-desc" className="mb-1 block text-[0.72rem] font-semibold text-[#5c5e62]">
                      Description <span className="font-normal text-[#8c8f94]">(optional)</span>
                    </label>
                    <input
                      id="imp-desc"
                      value={description}
                      maxLength={500}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What this design is for"
                      className="h-10 w-full rounded-lg border border-black/[0.12] bg-white px-3 text-[0.85rem] text-[#171a20] outline-none placeholder:text-[#b0b3b8] focus:border-[#f4511e]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => callImport(false)}
                    disabled={saving || !name.trim()}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f4511e] px-5 text-[0.85rem] font-semibold text-white transition hover:bg-[#d8410f] disabled:opacity-50"
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                      : "Save this design"
                    }
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
