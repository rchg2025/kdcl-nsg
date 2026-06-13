const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to match patterns like:
  // .sort((a, b) => smartSearch(b.name, searchVar) - smartSearch(a.name, searchVar))
  // and replace them with:
  // .map(item => ({ item, _score: smartSearch(item.name, searchVar) }))
  // .sort((a, b) => b._score - a._score)
  // .map(obj => obj.item)

  // A regex to find: .sort((a, b) => smartSearch(X, Y) - smartSearch(Z, W))
  // where X has 'b.' and Z has 'a.' and Y == W.
  const regex = /\.sort\(\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\)\s*=>\s*smartSearch\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*-\s*smartSearch\(\s*([^,]+)\s*,\s*([^)]+)\s*\)\s*\)/g;

  content = content.replace(regex, (match, a, b, bProp, searchVar1, aProp, searchVar2) => {
    // bProp might be `${b.year} - ${b.name}` or `b.name`
    // We replace the variable `b` in `bProp` with `_item` to use in our map
    // E.g., `b.name` -> `_item.name`
    
    // Create a safe string replacement function
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceVar = (propString, varName, newVarName) => {
      // Find whole words matching varName
      const r = new RegExp(`\\b${escapeRegExp(varName)}\\b`, 'g');
      return propString.replace(r, newVarName);
    };

    const targetProp = replaceVar(bProp, b, '_item');

    return `.map(_item => ({ _item, _score: smartSearch(${targetProp}, ${searchVar1}) }))\n  .sort((a, b) => b._score - a._score)\n  .map(obj => obj._item)`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'src/app/admin/criteria/ClientCriteriaList.tsx',
  'src/app/admin/criteria/SharedEvidenceSelectorModal.tsx',
  'src/app/collaborator/evidence/ClientEvidenceList.tsx',
  'src/app/investigator/evaluate/ClientInvestigateList.tsx',
  'src/app/investigator/evidence/ClientInvestigatorEvidenceList.tsx',
  'src/app/supervisor/review/ClientReviewList.tsx',
];

files.forEach(f => replaceInFile(path.join(__dirname, f)));
console.log("Replaced sort usages");
