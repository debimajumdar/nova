// Static, human-written content for the MRI Ready pathway.
// General educational text only; each hospital's own instructions take priority.
// Sources: MedlinePlus "MRI" (https://medlineplus.gov/ency/article/003335.htm)

export const SOURCE = { label: "MedlinePlus: MRI", url: "https://medlineplus.gov/ency/article/003335.htm" };

export const UNDERSTAND_MRI = [
  "MRI (magnetic resonance imaging) uses a strong magnet and radio waves to make detailed pictures of the inside of the body. It does not use X-ray radiation.",
  "Your child lies on a table that slides into a tube-shaped scanner. Scans often take 30 to 60 minutes. The machine is loud, so your child will get ear protection.",
  "Your child needs to stay very still. Some children have medicine to help them sleep or relax (sedation). Your care team will tell you if this is planned.",
  "Sometimes a contrast dye is given through an IV to make some areas show up better.",
];

export const SAFETY_SCREENING = {
  tell: [
    "Pacemaker or other implanted electronic device",
    "Cochlear (ear) implant",
    "Metal from surgery: clips, pins, plates, rods, or a shunt",
    "Braces or a permanent retainer",
    "Any metal fragments in the body, including the eyes",
  ],
  remove: [
    "Jewelry, hair clips, and watches",
    "Clothing with metal zippers, snaps, or glitter",
    "Glasses, hearing aids, and phones",
  ],
};

export const PREP_INSTRUCTIONS = [
  "If your child will have sedation or anesthesia, your care team will give you exact eating and drinking rules. Follow them carefully, or the scan may need to be rescheduled.",
  "Plan to arrive early to check in and finish the safety form.",
  "Bring a comfort item without metal, like a soft toy or blanket.",
  "Dress your child in comfortable clothes without metal.",
];

// Content the AI may rewrite, keyed by pathway step. The server looks text up here; the browser never sends it.
export const APPROVED_TEXT: Record<"understand-mri" | "prep-instructions", string[]> = {
  "understand-mri": UNDERSTAND_MRI,
  "prep-instructions": PREP_INSTRUCTIONS,
};
