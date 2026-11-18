// Static guides remain readable and linked when JavaScript is unavailable.
export function searchTerms(value) {
  return value.toLowerCase()
    .replace(/\b(colored|color)\b/g, "coloured")
    .replace(/\b(couch|upholstery)\b/g, "sofa")
    .replace(/\b(jeans)\b/g, "denim")
    .replace(/\b(oily|oil)\b/g, "grease")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word && !["on", "a", "an", "the", "from", "stain", "stains"].includes(word));
}

export function setupDirectory(doc) {
  const search = doc.querySelector("#guide-filter");
  if (!search) return;
  search.closest?.(".directory-controls")?.removeAttribute("hidden");
  const category = doc.querySelector("#guide-material");
  const cards = [...doc.querySelectorAll(".directory-card")];
  const reset = doc.querySelector("#reset-finder");
  function update() {
    const terms = searchTerms(search.value);
    let count = 0;
    for (const card of cards) {
      const show = (!category.value || category.value === card.dataset.material)
        && terms.every(word => card.dataset.filter.includes(word));
      card.hidden = !show;
      if (show) count++;
    }
    doc.querySelector("#guide-count").textContent = count + (count === 1 ? " guide" : " guides");
    doc.querySelector("#guide-empty").hidden = count > 0;
    reset.disabled = !search.value && !category.value;
  }
  search.addEventListener("input", update);
  category.addEventListener("change", update);
  reset.addEventListener("click", () => {
    search.value = "";
    category.value = "";
    update();
    search.focus();
  });
  update();
}

function setupChecklist(doc) {
  const steps = [...doc.querySelectorAll(".guide-steps > li")];
  if (!steps.length) return;
  const meter = doc.createElement("output");
  meter.className = "reader-count";
  meter.setAttribute("aria-live", "polite");
  const inputs = steps.map((step, index) => {
    const number = step.querySelector(".guide-step-num");
    const title = step.querySelector("h3");
    const box = doc.createElement("input");
    box.type = "checkbox";
    box.className = "reader-check";
    box.setAttribute("aria-label", "Mark step " + (index + 1) + " complete: " + title.textContent);
    number.after(box);
    box.addEventListener("change", () => {
      step.classList.toggle("reader-done", box.checked);
      update();
    });
    return box;
  });
  function update() {
    meter.textContent = inputs.filter(input => input.checked).length + " of " + inputs.length + " steps marked";
  }
  update();
  steps[0].parentElement.before(meter);
}

if (typeof document !== "undefined") {
  setupDirectory(document);
  setupChecklist(document);
  document.querySelectorAll("[data-current-year]").forEach(el => el.textContent = new Date().getFullYear());
  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}), { once: true });
  }
}
