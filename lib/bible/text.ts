// Cleanup for passage text returned by API.Bible (content-type=text).
//
// Some versions mark paragraph starts with a pilcrow ("¶Lámpara es a mis
// pies…" in NBLA Psalm 119:105). It is an editorial layout mark, not part of
// the verse, and it showed up on cards, in previews and in the games, so it
// is dropped before the text is cached. Whitespace is collapsed as before.
export function cleanPassageText(raw: string): string {
  return raw.replace(/¶/g, " ").replace(/\s+/g, " ").trim();
}
