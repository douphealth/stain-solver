import { getStain, getSurface, getAge, SOURCES, STAIN_SCIENCE, REVIEWED } from './data.js';

/**
 * Deterministic household first-aid guidance. Material restrictions always
 * override generic stain chemistry. No automated chemical mixing instructions.
 * Time recommendations appear only where the linked source supports them.
 */
const step = (title, body, extra={}) => ({ title, body, ...extra });
const waterStains = new Set(['coffee','tea','red-wine','blood']);
const solids = new Set(['chocolate','tomato','grease','makeup']);
const SAFE_CODES = new Set(['unknown','w','ws','s','x']);
const SAFE_CARE = new Set(['unsure','washable','dry-clean']);

export function firstMoveFor(stain, age) {
 if (stain.id === 'mud') return age.id==='fresh' ? 'Let ordinary mud dry, then lift it without grinding in the grit.' : 'Brush off loose dry mud gently, keeping grit off the fabric.';
 if (stain.id === 'sweat') return 'Check whether this is residue or permanent fabric fading. Do not scrub discoloured fibres.';
 if (stain.id === 'blood') return 'Avoid bare-handed contact with blood. For a small spill you can handle safely, use protective gloves and blot without rubbing; otherwise seek professional help.';
 if (stain.id === 'ink') return 'Place a clean white towel under the spot and blot. Do not drag or spread the ink.';
 if (solids.has(stain.id)) return 'Lift excess solids or oily material with a spoon or the edge of a dull tool. Do not rub.';
 if (waterStains.has(stain.id)) return 'Blot with a clean white absorbent cloth. Work gently; do not rub the spill wider.';
 return 'Gently blot or lift excess material. Avoid pressure and rubbing.';
}
function finishFor(surface) {
 return ({'white-cotton':'White cotton is not automatically bleach-safe. Read its label.',
 'coloured-cotton':'Check for dye transfer on a hidden seam before using any cleaner.',
 'denim':'Indigo may transfer or fade with aggressive treatment.',
 'synthetic':'Synthetics and coatings can be heat- or solvent-sensitive.',
 'wool':'Follow the wool care label; never default to ordinary enzyme or bleach treatment.',
 'silk':'Silk often watermarks or bleeds dye; professional care is usually safest.',
 'sofa':'The W / W-S / S / X furniture code controls which cleaners are permitted.',
 'carpet':'This route is ONLY for manufacturer-approved synthetic, colourfast carpet.',
 'leather':'This route assumes finished leather, not suede, nubuck or unfinished hides.',
 'wood':'Identify the finish; excess moisture and acids can damage sealed wood.'})[surface.id];
}
function washable(stain,surface,age,{dairy,heat}) {
 const steps=[];
 if(stain.id==='mud'){
  steps.push(step('Lift the dry grit','If mud is wet, allow it to dry. Gently brush off loose soil, working without grinding it into the yarn.'));
  steps.push(step('Apply a labelled laundry pretreatment','Use a little liquid laundry detergent on the mark only if fabric and product labels permit. Work gently; wait exactly the product-label contact time, then rinse.'));
 } else if(stain.id==='ink') {
  steps.push(step('Blot onto an absorbent towel','Place an absorbent white towel under the mark. Blot from the outside inward, shifting to a clean towel section each time.'));
  steps.push(step('Check compatibility before any ink solvent',surface.id==='synthetic'
   ?'Some polyester blends, finishes and coatings can be altered by solvents. If fabric instructions do not expressly allow a suitable ink remover, stop and consult a cleaner.'
   :'Some inks respond to a suitable spot remover, but dye and finish damage are possible. If the garment label and product instructions permit, test a hidden seam first; stop immediately for dye transfer. Do not pour or mix solvents.'));
 } else if(stain.id==='blood'){
  steps.push(step('Rinse with cool water',age.id==='fresh' ? 'Flush the back of washable fabric with cool running water. Never start fresh blood with hot water.' : 'Loosen the dried blood gently with cool water. Avoid scraping or scrubbing the fibre.'));
  steps.push(step('Pre-treat protein residue','If both labels permit, use an enzyme-containing laundry pretreatment for the time printed on its label. Rinse, then wash. Do not use this on wool or silk.'));
 } else if(stain.id==='grease'||stain.id==='makeup') {
  steps.push(step('Lift excess oil or pigment','Dab away oily residue and any loose material with a fresh white towel or spoon. Avoid spreading it.'));
  steps.push(step('Use a laundry detergent intended for oily marks','If permitted by the care label, put a small amount of liquid laundry detergent on the spot. Use the product-label quantity and contact time. Rinse before laundering.'));
 } else if(stain.id==='tomato'||stain.id==='chocolate'){
  steps.push(step('Remove the food first','Spoon off any remaining particles without pressing them through the fabric.'));
  steps.push(step('Flush and pre-treat','Rinse from the reverse with cool water, if the label permits. Follow with fabric-compatible liquid laundry detergent or labelled pretreatment and rinse thoroughly.'));
 } else if(stain.id==='grass') {
  steps.push(step('Pre-treat the green mark','If the care label permits enzymes, use an enzyme laundry pre-treatment according to the package. Skip it for wool, silk, and products marked unsuitable.'));
  steps.push(step('Rinse according to product directions','Rinse away the treatment before laundering. Do not combine it with a second cleaner.'));
 } else if(stain.id==='sweat') {
  steps.push(step('Check for dye damage','Compare the mark to nearby fabric. A yellowed residue may respond to treatment; a faded or bleached patch may be permanent.'));
  steps.push(step('Target clothing residue','Use a little liquid laundry detergent or labelled prewash product; for heavy deodorant buildup, ACI suggests a 5–10 minute pretreatment before washing.',{minutes:10,timeNote:'ACI specifically gives 5–10 minutes for heavy deodorant marks.'}));
 } else {
  steps.push(step('Move the beverage out with cool water',age.id==='fresh' ? 'Rinse from the back under cool water, or gently sponge with cool water if the garment label permits.' : 'Dampen the old mark with cool water if the garment label permits. Do not scrub the dried colour into the weave.'));
  if(stain.id==='red-wine') {
    steps.push(step('Cool-water soak, when the label permits','The American Cleaning Institute describes a cool-water soak for wine, up to about 30 minutes. Skip soaking on garments that should not be immersed.',{minutes:30,timeNote:'ACI specifies about 30 minutes for wine.'}));
  }
  if((stain.id==='coffee'||stain.id==='tea')&&dairy) {
    steps.push(step('Treat the milk or cream component','Because this drink contains dairy, treat the remaining protein/fat with a fabric-compatible enzyme detergent if the labels allow; use the product’s stated contact time. Do not use enzymes on wool or silk.'));
  } else {
    steps.push(step('Pre-treat with labelled laundry detergent','Use a small amount of laundry detergent or a pretreatment marked safe for this fabric. Follow the cleaner’s contact time and rinse thoroughly.'));
  }
 }
 let material = ({'white-cotton':'If considering an oxygen laundry product for a persistent mark, check BOTH the textile’s bleach symbol and the cleaner instructions; never assume white means bleach-safe.',
 'coloured-cotton':'Wash with similar colours; skip bleaching products unless both labels permit them.',
 'denim':'Turn the garment inside out if its label advises it, to help reduce colour loss.',
 'synthetic':'Use only the temperature and drying method stated on the label.'})[surface.id]||'';
 steps.push(step('Launder once, then inspect',`Wash at the label-approved temperature with laundry detergent. ${material} Check the stain while the garment is still damp; air-dry rather than tumble-dry until it is gone.`));
 if(age.id==='dried'||heat)steps.push(step('If you can still see the mark','A set stain may be difficult or impossible to restore. Only repeat a label-approved pretreatment after checking for dye transfer or fabric damage; if uncertain, stop and seek a professional.'));
 return steps;
}
function wool(stain,age){
 const s=[step('Lift or blot without rubbing',firstMoveFor(stain,age)),
 step('Confirm the wool label','If it specifies professional dry cleaning, or this is lined/structured wool, stop home treatment now.'),
 step('Use only wool-specific care when washable', 'For washable wool only: patch-test first, then gently dab with a lint-free cloth lightly dampened with cool water and wool-approved detergent diluted as directed. Avoid saturation, heat and aggressive rubbing.'),
 step('Remove residue gently and dry correctly','Blot with a barely damp clean cloth and dry as the label instructs. Consult a wool-care professional if a ring or residue remains.')];
 if(['ink','grease','makeup'].includes(stain.id)) {
   s[2]=step('Pause before using a solvent','Oily stains, ink and cosmetics can require solvent care; ordinary home solvents may disturb wool dyes. Ask a wool specialist for the correct approach.'); s.pop();
 }
 return s;
}
function silk(stain,age){return [step('Blot, do not rub',firstMoveFor(stain,age)),step('Avoid unapproved liquids','Do not soak, spot-bleach, rub, or try alcohol/vinegar on silk without garment-maker instructions. Water rings and dye bleeding are possible.'),step('Ask for silk-specific professional care','Describe the substance and timing to the cleaner and take the care label. Keep the garment away from dryers and irons.')];}
function sofa(stain,age,code) {
 const s=[step('Blot or lift the excess',firstMoveFor(stain,age))];
 if(code==='unknown')return [...s,step('Find the furniture code','Check the tag beneath a cushion or frame. Do not apply water or a cleaner until you identify W, W/S, S or X.'),step('No legible code? Pause here','Ask the maker or a professional upholstery cleaner rather than guessing with household recipes.')];
 if(code==='x')return [...s,step('X: vacuum-only care','If the maker permits, vacuum dry loose particles only. No water or solvents. Call a professional for the remaining spot.')];
 if(code==='s')return [...s,step('S: water is not permitted','The maker calls for solvent-only care. Do not improvise with household solvents. Use manufacturer instructions or a trained upholstery cleaner.')];
 s.push(step('Patch-test first','For W or W/S upholstery, follow the furniture maker’s water-based cleaner instructions. Check a hidden spot for dye transfer and rings. Never saturate the cushion.'));
 if(['ink','grease','makeup'].includes(stain.id)) s.push(step('Do not force an oily or ink stain','Water-based cleaning may not lift oily pigment. Avoid improvised solvents; a qualified upholstery cleaner is the safer next step.'));
 else s.push(step('Gently dab a maker-approved solution','Use a barely damp white cloth and maker-approved water-based upholstery cleaner, working from the outside inward. Do not pour or spray directly into the cushion.'));
 s.push(step('Lift residue and air-dry','Blot the residue with a new barely damp cloth only if permitted, then use a dry towel and airflow. Stop if a ring forms.'));
 return s;
}
function carpet(stain,age){
 const s=[step('Lift or blot the spill',firstMoveFor(stain,age)),step('Check carpet fibre and maker instructions','Proceed only with synthetic, colourfast carpet where the carpet manufacturer allows damp spot cleaning. Wool, silk or unknown rugs need specialist advice.')];
 if(['ink','grease','makeup'].includes(stain.id))s.push(step('Avoid unapproved solvents','Ink or oily residues may need a specialist product or professional cleaning. Solvents can affect backing and dye; do not test on a visible area.'));
 else {
  s.push(step('Mild spot treatment — if approved','IICRC suggests a few drops of liquid dish soap in 1 cup (about 240 mL) of water. Patch-test, then apply with a barely damp white cloth. Blot from the outside inward; do not saturate.'));
  s.push(step('Remove residue and dry','Blot with another cloth dampened with clean water, then press with dry towels. Avoid leaving soapy residue or wetting the carpet backing.'));
 }
 return [...s,step('Stop if it spreads or changes','Stop for dye movement, rings, sticky residue or persistent marks. Consult an IICRC-qualified cleaner.')];
}
function leather(stain,age){return [step('Absorb without rubbing',firstMoveFor(stain,age)),step('Avoid household stain chemistry','Use a clean, soft dry cloth. Alcohol, bleach, vinegar, abrasives and heavy wetting can harm the finish.'),step('Use leather-maker care only','Only use a finish-compatible method specified by the manufacturer, and test in a hidden place. For ink, dye transfer or persistent marks, seek a leather specialist.')];}
function wood(stain,age){return [step('Remove liquid immediately',firstMoveFor(stain,age)),step('Dry seams and edges','Use a clean dry soft cloth. A slightly damp cloth is only acceptable if your finish manufacturer permits it. Never leave standing water.'),step('Protect the finish','Avoid steam, strong acids, alcohol, bleach and abrasives without finish-specific authorization. Stop for whitening, softening or swelling and contact a wood-care professional.')];}

export function buildPlan({stainId,surfaceId,ageId,upholsteryCode='unknown',care='unsure',dairy=false,heat=false}={}) {
 const stain=getStain(stainId),surface=getSurface(surfaceId),age=getAge(ageId);
 if(!stain||!surface||!age)return null;
 const code=SAFE_CODES.has(upholsteryCode)?upholsteryCode:'unknown';
 const washCare=SAFE_CARE.has(care)?care:'unsure';
 const opts={dairy:!!dairy,heat:!!heat};
 const kind=surface.kind;
 const dryClean=(kind==='washable'||kind==='wool'||kind==='silk')&&washCare==='dry-clean';
 const notWashable=(kind==='washable'||kind==='wool')&&washCare==='dry-clean';
 let steps,status,statusLabel,summary,stop,sourceIds;
 if(dryClean){
   steps=[step('Lift or blot without rubbing',firstMoveFor(stain,age)),step('Stop home wet-cleaning here','Your label specifies professional dry cleaning. Do not use water, detergent, bleach, soaking or improvised solvents. Photograph the spot and show the cleaner the care label.'),step('Tell the cleaner what happened',`Report ${stain.name.toLowerCase()}, whether it was fresh or dried${opts.heat?', and that it has already been heat-treated':''}. Early professional assessment may reduce further damage.`)];
   status='pro';statusLabel='DRY-CLEAN ONLY · STOP';summary='The garment care label overrides general stain advice. Do not try a home soaking or detergent procedure.';
   stop='Stop after dry blotting. The care label says professional dry cleaning.';sourceIds=['ginetex','aci'];
 }else if(kind==='washable'){
   steps=washable(stain,surface,age,opts); status='go';statusLabel=washCare==='unsure'?'CHECK LABEL FIRST':'CAREFUL HOME STEPS';
   summary='For a washable, colourfast item, the steps below follow the stain type and fabric label. Skip anything the label forbids.';
   stop='Stop if the care label forbids treatment, dye transfers, fibre weakens, or cleaning spreads the mark.';
   sourceIds=['aci','ginetex'];
 }else if(kind==='wool'){
   steps=wool(stain,age);status=['ink','grease','makeup'].includes(stainId)?'pro':'caution';statusLabel=status==='pro'?'WOOL SPECIALIST ADVISED':'WOOL LABEL REQUIRED';
   summary='Wool has separate fibre and wash rules. Ordinary detergents, enzymes and rough handling may damage it.';
   stop='Stop for dry-clean-only, structured or lined garments, water rings or dye movement.';sourceIds=['woolmark','ginetex'];
 }else if(kind==='silk'){
   steps=silk(stain,age);status='pro';statusLabel='PROFESSIONAL CARE ADVISED';summary='Home wet spot treatment can leave permanent marks on silk.';
   stop='Stop after dry blotting unless the specific garment maker permits a safe process.';sourceIds=['ginetex'];
 }else if(kind==='upholstery'){
   steps=sofa(stain,age,code);status=code==='w'||code==='ws'?'caution':'pro';statusLabel=code==='unknown'?'FIND YOUR SOFA CODE':code==='w'||code==='ws'?'PATCH-TEST FIRST':'NO WATER-BASED CLEANING';
   summary='The manufacturer cleaning code takes priority; unknown, S and X must not receive generic wet-cleaning instructions.';
   stop='Stop for an unknown, S or X code before wet treatment. Stop if colour transfers, a water ring appears or filling is saturated.';sourceIds=['upholstery'];
 }else if(kind==='carpet'){
   steps=carpet(stain,age);status=['ink','grease','makeup'].includes(stainId)?'caution':'go';statusLabel=status==='go'?'SYNTHETIC CARPET ONLY':'SPECIAL CARE NEEDED';
   summary='For synthetic, colourfast carpet only, after maker approval and a patch test. Never saturate carpet or backing.';
   stop='Stop for wool, silk, antique or unknown rug fibres, dye movement, residue or water rings.';sourceIds=['iicrc'];
 }else if(kind==='leather'){
   steps=leather(stain,age);status='pro';statusLabel='LEATHER FINISH SENSITIVE';summary='Leather finishes vary. Gentle blotting and manufacturer-approved care are safer than general stain remedies.';
   stop='Stop for darkening, dye transfer, finish loss, or any mark remaining after initial blotting.';sourceIds=['upholstery'];
 }else{
   steps=wood(stain,age);status='pro';statusLabel='PROTECT THE WOOD FINISH';summary='Prompt removal and drying protects finished wood; no universal wood stain-removal chemical applies.';
   stop='Stop if the finish softens, clouds, whitens, lifts or swells.';sourceIds=['wood'];
 }
 if(stain.id==='blood'){
   steps.unshift(step('Blood exposure precaution','Blood from another person or an unknown source can pose infection risks. Avoid direct contact; use appropriate gloves and precautions. For a substantial or potentially infectious spill, stop and contact a qualified professional.'));
   sourceIds=[...new Set([...sourceIds,'iicrc'])];
 }
 if(opts.heat && !dryClean && (kind==='washable'||kind==='wool'||kind==='silk')){
   steps.unshift(step('Heat-exposed stain: inspect before treating','This mark has already been washed hot, tumble-dried or ironed. It may be more difficult to remove. Do not apply more heat; check for damage and continue only with care-label-approved steps.'));
 }
 const dont=[kind==='washable'?'Do not iron or tumble-dry while the mark remains.':'Do not rub, scrub or abrade the spot.',
 kind==='silk'||kind==='wool'?'Do not use ordinary enzyme stain removers, bleach or hot water on delicate fibres without maker approval.':'Never mix bleach with another cleaner, including acids or ammonia.',
 kind==='upholstery'?'Do not add water before confirming W, W/S, S or X.':kind==='wood'||kind==='leather'?'Do not soak the finish or improvise solvents.':'Do not skip a hidden-place dye/finish test.'];
 if(stain.id==='blood')dont[0]='For fresh blood, do not start with hot water.';
 const supplies=kind==='washable'?['Clean white absorbent cloth','Cool water','Care-label-compatible laundry detergent']
 :kind==='wool'?['Clean lint-free cloth','Garment care label','Approved wool detergent, only if washable']
 :kind==='silk'?['Dry lint-free cloth','Care label','Silk-care professional']
 :kind==='upholstery'?['Clean white towels','Furniture care-code tag',code==='w'||code==='ws'?'Maker-approved water-based upholstery cleaner':'Manufacturer instructions']
 :kind==='carpet'?['White towels','Carpet fibre/care instructions','Clear dish liquid, only if approved']
 :['Soft dry cloth','Finish-specific maker instructions','Specialist if marks remain'];
 const sourceSet=[...new Set([...sourceIds,'cdc','poison'])];
 const science=STAIN_SCIENCE[stainId];
 const followup=status==='pro'||dryClean?'Do not escalate with household chemicals. Contact a professional cleaner familiar with this material.'
 :kind==='washable'?'If a faint mark remains after the first labelled cycle, check for colour damage, then consider one more product-label-approved pretreatment. Keep it away from heat. Stop if there is no improvement.'
 :'If the first gentle method leaves a mark, do not scrub or change chemicals. Check the manufacturer guide or ask a specialist.';
 return {stain,surface,age,code,care:washCare,dairy:opts.dairy,heat:opts.heat,
  status,statusLabel,summary,steps,firstMove:firstMoveFor(stain,age),dont,supplies,stop,
  warning:finishFor(surface),note:stain.note,science,followup,
  sources:sourceSet.map(id=>({...SOURCES[id],id})),sourceIds:sourceSet,
  title:`${stain.name} on ${surface.name.toLowerCase()}`,updated:REVIEWED,
  recommendedMinutes:steps.filter(s=>s.minutes).reduce((v,s)=>v+s.minutes,0)
 };
}

/** Red flags use conservative wording. No output ever suggests layering cleaners. */
export function checkCleanerCombination(a,b){
 const names={bleach:'Chlorine bleach',ammonia:'Ammonia or glass cleaner',acid:'Vinegar or acid-based cleaner',alcohol:'Rubbing alcohol or alcohol cleaner',peroxide:'Hydrogen peroxide',detergent:'Laundry detergent',dish:'Dish liquid',unknown:'Unknown cleaning product'};
 if(!(a in names)||!(b in names))return null;
 if(a===b)return {risk:'caution',title:'Do not combine different formulations',message:'Even cleaners in the same category may contain other ingredients. Follow each product label and do not mix.'};
 if(a==='bleach'||b==='bleach')return {risk:'danger',title:'Do not mix — potentially hazardous',message:'Household chlorine bleach must not be mixed with other cleaners. In particular, acids can release chlorine gas and ammonia can release chloramines. If you have already mixed them, leave the area and seek local poison/emergency advice.'};
 if(a==='unknown'||b==='unknown')return {risk:'caution',title:'Ingredients unknown — do not mix',message:'Do not mix or layer products when one formulation is unknown. Read ingredients and safety instructions first.'};
 return {risk:'caution',title:'Keep products separate',message:'Do not mix or layer household cleaners, even if this pair is not singled out in our safety sources. Rinse only according to the individual product label and seek guidance if you are unsure.'};
}
