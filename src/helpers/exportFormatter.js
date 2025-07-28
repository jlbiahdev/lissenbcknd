// helpers/exportFormatter.js

/**
 * Formatte une liste de méditations approuvées au format JSON spécifique Lissen.
 * Chaque entrée est structurée avec une clé "reference" et un champ "commentary",
 * ainsi que les éventuels "themes" associés.
 */
function formatMeditationsForExport(meditations) {
  return meditations.map(({ Verse, commentary, Themes }) => ({
    reference: `${Verse.book} ${Verse.chapter}:${Verse.verse}`,
    commentary,
    themes: Themes?.map(t => t.name) || [],
  }));
}

module.exports = {
  formatMeditationsForExport,
};
