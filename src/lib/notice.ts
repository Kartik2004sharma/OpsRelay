export function noticeDates(text: string) {
  return [...new Set(text.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [])].filter((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  });
}

export function validateNotice(title: unknown, body: unknown) {
  if (typeof title !== "string" || title.trim().length < 4 || title.length > 100) throw new Error("Enter a document title of 4–100 characters.");
  if (typeof body !== "string" || body.trim().length < 30 || body.length > 8000) throw new Error("Enter a text notice of 30–8000 characters.");
  if (!/kestrel/i.test(body) || !/\bM14\b/i.test(body)) throw new Error("Enter a notice naming Kestrel and the M14 component supported by this workspace.");
  const dates = noticeDates(body);
  if (!dates.length || dates.length > 8) throw new Error("Enter a notice containing 1–8 valid ISO dates (YYYY-MM-DD).");
  return { title: title.trim(), body: body.trim(), dates };
}
