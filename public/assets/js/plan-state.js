// Shared URLs and saved plans must carry the same inputs as the active plan.
export function normalizePlan(input) {
  return {
    stain: input.stain,
    surface: input.surface,
    age: input.age,
    code: input.code ?? 'unknown',
    care: input.care ?? 'unsure',
    dairy: input.dairy === true || input.dairy === 'true',
    heat: input.heat === true || input.heat === 'true',
    tried: input.tried ?? 'nothing',
  };
}
