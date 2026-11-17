/**
 * Stain Solver: public, curated decision data.
 * General household guidance only; always defer to manufacturer and care instructions.
 * Reference pages rechecked November 1, 2026. No claims of independent testing.
 */
export const SOURCES = {
  aci: {
    name: 'American Cleaning Institute',
    detail: 'Stain Removal Guide — garment treatment and drying precautions',
    url: 'https://www.cleaninginstitute.org/cleaning-tips/clothes/stain-removal-guide'
  },
  woolmark: {
    name: 'Woolmark',
    detail: 'Wool Care — special handling for wool fibres',
    url: 'https://www.woolmark.com/care/'
  },
  ginetex: {
    name: 'GINETEX',
    detail: 'ISO 3758:2023 care-label symbols explained',
    url: 'https://www.ginetex.net/gb/labelling/care-symbols.asp'
  },
  carpet: {
    name: 'Shaw Floors',
    detail: 'Carpet care — detergent dilution, gentle blotting, rinsing',
    url: 'https://shawfloors.com/en-us/care-and-warranties/carpet/detergent'
  },
  upholstery: {
    name: 'La-Z-Boy',
    detail: 'Fabric & Leather Care — upholstery cleaning codes and leather spill care',
    url: 'https://content.la-z-boy.com/content/CustomerCare/fabric-and-leather-care/'
  },
  wood: {
    name: 'National Wood Flooring Association',
    detail: 'Maintenance — prompt drying and finish-specific cleaners',
    url: 'https://woodfloors.org/maintenance/'
  },
  iicrc: {
    name: 'IICRC',
    detail: 'Carpet spot-cleaning tips from a restoration and cleaning standards organization',
    url: 'https://iicrc.org/wp-content/uploads/2023/01/Tip-Sheet-Carpet-Topics.pdf'
  },
  poison: {
    name: 'Poison Control',
    detail: 'Why bleach, ammonia and acidic cleaners must not be combined',
    url: 'https://www.poison.org/articles/chlorine-gas'
  },
  cdc: {
    name: 'CDC',
    detail: 'Cleaning-chemical safety — do not combine cleaners',
    url: 'https://www.cdc.gov/hygiene/about/cleaning-and-disinfecting-with-bleach.html'
  }
};

export const STAINS = [
  { id: 'coffee', name: 'Coffee', short: 'CO', category: 'Drinks', color: '#B38A70', tint: '#F2DCCB', shape: 'one', type: 'liquid', intro: 'Coffee can leave a coloured residue, especially after it dries.', note: 'Coffee with milk can also leave a fatty residue.' },
  { id: 'red-wine', name: 'Red wine', short: 'RW', category: 'Drinks', color: '#9D4E63', tint: '#ECD3DA', shape: 'two', type: 'liquid', intro: 'Red wine pigments can spread quickly through absorbent fibres.', note: 'Salt, white wine and boiling water are not reliable universal fixes.' },
  { id: 'grease', name: 'Grease & oil', short: 'GO', category: 'Food', color: '#C79445', tint: '#F5E3BA', shape: 'three', type: 'oily', intro: 'Oil needs a different approach than water-based drink stains.', note: 'Extra heat can help set stains or damage some fabrics; the care label sets the limit.' },
  { id: 'blood', name: 'Blood', short: 'BL', category: 'Everyday', color: '#B65F5F', tint: '#EBC8C3', shape: 'two', type: 'protein', intro: 'Blood is a protein-based stain, so cooler water is a sensible first move.', note: 'For blood that may be infectious, use protective precautions; do not handle another person’s blood without appropriate protection.' },
  { id: 'chocolate', name: 'Chocolate', short: 'CH', category: 'Food', color: '#765844', tint: '#E7D8C8', shape: 'one', type: 'solid', intro: 'Chocolate combines solids and oils: lift the excess before cleaning.', note: 'Avoid spreading melted chocolate by rubbing.' },
  { id: 'ink', name: 'Ink', short: 'IN', category: 'Everyday', color: '#4A6894', tint: '#D1DFEF', shape: 'three', type: 'ink', intro: 'Different pen inks behave differently; some cannot be completely removed.', note: 'Solvents can affect dyes, coatings and some synthetics. Test cautiously or use professional care.' },
  { id: 'grass', name: 'Grass', short: 'GR', category: 'Outdoors', color: '#78905A', tint: '#E3EACB', shape: 'one', type: 'plant', intro: 'Grass stains may respond to a suitable laundry pretreatment on washable fabrics.', note: 'Enzyme products are not appropriate for every fibre; check the care label.' },
  { id: 'tomato', name: 'Tomato sauce', short: 'TO', category: 'Food', color: '#C75B47', tint: '#F3D2C4', shape: 'two', type: 'solid', intro: 'Tomato sauce can contain both strong pigment and cooking oil.', note: 'Lift the sauce first; forcing it through the fabric can deepen the stain.' },
  { id: 'makeup', name: 'Makeup', short: 'MU', category: 'Everyday', color: '#B07F92', tint: '#F1DDE3', shape: 'three', type: 'oily', intro: 'Many foundations and lip products contain pigments and oils.', note: 'Colourfastness matters as much as stain removal, especially on dyed textiles.' },
  { id: 'mud', name: 'Mud', short: 'MD', category: 'Outdoors', color: '#887560', tint: '#E9E0D0', shape: 'one', type: 'mud', intro: 'Wet mud spreads; it is often easier to lift once it has dried.', note: 'Brush dried mud gently without grinding grit into the fibres.' },
  { id: 'sweat', name: 'Sweat marks', short: 'SW', category: 'Everyday', color: '#9D9963', tint: '#EEECCD', shape: 'three', type: 'body', intro: 'Sweat, skin oils and deodorant can leave different marks.', note: 'If perspiration has changed the fabric dye itself, cleaning may not restore the colour.' },
  { id: 'tea', name: 'Tea', short: 'TE', category: 'Drinks', color: '#9E8468', tint: '#ECE0C9', shape: 'two', type: 'liquid', intro: 'Tea tannins may leave visible colouring as liquid dries.', note: 'A cool-water rinse and fabric-safe pretreatment are good first choices on washable garments.' }
];

export const SURFACES = [
  { id: 'white-cotton', name: 'White cotton', subtitle: 'Shirts, towels, bedding', kind: 'washable', tag: 'WASHABLE', short: 'WC' },
  { id: 'coloured-cotton', name: 'Coloured cotton', subtitle: 'Everyday coloured clothes', kind: 'washable', tag: 'COLOUR CARE', short: 'CC' },
  { id: 'denim', name: 'Denim', subtitle: 'Jeans, jackets', kind: 'washable', tag: 'DYE-SENSITIVE', short: 'DN' },
  { id: 'synthetic', name: 'Synthetics', subtitle: 'Polyester, nylon blends', kind: 'washable', tag: 'LOW HEAT', short: 'SY' },
  { id: 'wool', name: 'Wool', subtitle: 'Jumpers, coats', kind: 'wool', tag: 'DELICATE', short: 'WO' },
  { id: 'silk', name: 'Silk', subtitle: 'Blouses, scarves', kind: 'silk', tag: 'FRAGILE', short: 'SI' },
  { id: 'sofa', name: 'Fabric sofa', subtitle: 'Check W / S / W-S / X code', kind: 'upholstery', tag: 'CHECK CODE', short: 'SF' },
  { id: 'carpet', name: 'Synthetic carpet', subtitle: 'Not wool or silk rugs', kind: 'carpet', tag: 'SPOT TEST', short: 'CP' },
  { id: 'leather', name: 'Finished leather', subtitle: 'Sofas, bags, shoes', kind: 'leather', tag: 'FINISH FIRST', short: 'LE' },
  { id: 'wood', name: 'Finished wood', subtitle: 'Tables, floors, shelves', kind: 'wood', tag: 'KEEP DRY', short: 'WD' }
];

export const AGES = [
  { id: 'fresh', name: 'Just happened', subtitle: 'Still wet or recently spilled', marker: '01' },
  { id: 'dried', name: 'Already dried', subtitle: 'Set in, old, or found later', marker: '02' }
];

export const getStain = (id) => STAINS.find(s => s.id === id);
export const getSurface = (id) => SURFACES.find(s => s.id === id);
export const getAge = (id) => AGES.find(s => s.id === id);

// What the stain typically contains is an explanatory classification, not a lab analysis.
export const STAIN_SCIENCE = {
 coffee: {family:'Tannin / beverage pigment',why:'Coffee leaves beverage pigments. Milk or cream adds protein and fat, so a dairy-containing spill needs a different pretreatment.'},
 'red-wine': {family:'Plant pigments / tannins',why:'Wine dyes absorbent fibres quickly. Removing the liquid first avoids spreading it; hot fixes are not universal.'},
 grease: {family:'Fat / oil',why:'Oil does not rinse away like a water-based drink. Use a fabric-compatible detergent before laundering.'},
 blood: {family:'Protein',why:'Fresh blood is protein-rich. Hot water at the beginning can make fresh blood harder to remove.'},
 chocolate: {family:'Fat + solids + pigment',why:'Chocolate combines fats and particles. Lift solids first, then treat residual oils on washable fabrics.'},
 ink: {family:'Dyes / solvents (varies)',why:'Pen and marker inks differ significantly. Solvent use can move pigment or damage finishes.'},
 grass: {family:'Plant pigment + soil',why:'Grass marks can embed plant pigments in washable textiles; enzyme pretreatment is only suitable for some fabrics.'},
 tomato: {family:'Plant pigment + often oil',why:'Sauce often contains both pigment and oil. Remove the solids before a gentle fabric-appropriate pretreatment.'},
 makeup: {family:'Cosmetic oils + pigment',why:'Many cosmetics contain oil-bound pigment; scrubbing can smear colour and disturb fabric dyes.'},
 mud: {family:'Mineral particles / soil',why:'Allowing ordinary mud to dry can make its gritty solids easier to lift without pushing them into fibres.'},
 sweat: {family:'Body oils + deodorant residue',why:'Yellowing can involve body oils, deodorant residue or actual dye changes. Dye damage cannot be washed out.'},
 tea: {family:'Tannin / beverage pigment',why:'Tea contains colour compounds that can leave a mark after evaporation; treat like a washable beverage stain where allowed.'}
};
export const REVIEWED = '1 November 2026';
