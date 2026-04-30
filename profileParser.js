function parseFitnessDetails(message = '') {
  const text = String(message);
  const lower = text.toLowerCase();
  const details = {};

  const weightMatch =
    lower.match(/(?:weight|wt|vajan|wajan)?\s*(\d{2,3}(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms)\b/i);
  if (weightMatch) {
    details.weight = trimNumber(weightMatch[1]);
  }

  const feetMatch = lower.match(/(\d)\s*(?:feet|foot|ft|')\s*(?:(\d{1,2})\s*(?:inch|inches|inch|in|")?)?/i);
  if (feetMatch) {
    const feet = feetMatch[1];
    const inches = feetMatch[2] || '0';
    details.height = `${feet}'${inches}"`;
  } else {
    const cmMatch = lower.match(/(\d{3})\s*(?:cm|centimeter|centimeters)\b/i);
    if (cmMatch) {
      details.height = `${cmMatch[1]} cm`;
    }
  }

  const ageMatch =
    lower.match(/(?:age|umar)\s*(?:is|:)?\s*(\d{1,2})\b/i) ||
    lower.match(/\b(\d{1,2})\s*(?:years|year|yrs|yr|saal)\b/i);
  if (ageMatch) {
    details.age = ageMatch[1];
  }

  const genderMatch = lower.match(/\b(male|female|man|woman|boy|girl|ladka|ladki)\b/i);
  if (genderMatch) {
    details.gender = normalizeGender(genderMatch[1]);
  }

  const goal = detectGoal(lower);
  if (goal) {
    details.goal = goal;
  }

  return details;
}

function trimNumber(value) {
  return String(Number(value));
}

function normalizeGender(value) {
  const normalized = String(value).toLowerCase();
  if (['male', 'man', 'boy', 'ladka'].includes(normalized)) return 'male';
  if (['female', 'woman', 'girl', 'ladki'].includes(normalized)) return 'female';
  return value;
}

function detectGoal(lower) {
  if (/(weight loss|fat loss|loss|slim|pet|motapa|vajan kam|wajan kam)/i.test(lower)) {
    return 'Weight loss';
  }
  if (/(muscle gain|muscle|bulk|body bana|gain)/i.test(lower)) {
    return 'Muscle gain';
  }
  if (/(better diet|diet|meal|khana)/i.test(lower)) {
    return 'Better diet';
  }
  if (/(full transformation|transformation|transform|fit ho)/i.test(lower)) {
    return 'Full transformation';
  }
  return '';
}

module.exports = { parseFitnessDetails };
