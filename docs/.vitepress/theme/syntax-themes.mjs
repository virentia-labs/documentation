// Both Markdown fences and precompiled walkthroughs use these exact themes.
function createTheme(name, type, palette) {
  return {
    name, type, displayName: `Virentia ${type}`,
    colors: { 'editor.background': palette.bg, 'editor.foreground': palette.text },
    tokenColors: [
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: palette.comment } },
      { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: palette.keyword } },
      { scope: ['string', 'string.quoted', 'string.template'], settings: { foreground: palette.string } },
      { scope: ['constant', 'constant.numeric', 'constant.language', 'support.constant'], settings: { foreground: palette.constant } },
      { scope: ['entity.name.function', 'support.function'], settings: { foreground: palette.function } },
      { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'], settings: { foreground: palette.type } },
      { scope: ['entity.name.tag', 'support.class.component'], settings: { foreground: palette.type } },
      { scope: ['entity.other.attribute-name', 'variable.parameter'], settings: { foreground: palette.attribute } },
      { scope: ['variable', 'meta.object-literal.key'], settings: { foreground: palette.text } },
      { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: palette.punctuation } },
      { scope: ['markup.heading', 'markup.bold'], settings: { foreground: palette.keyword, fontStyle: 'bold' } },
      { scope: ['markup.inline.raw'], settings: { foreground: palette.string } },
      { scope: ['invalid'], settings: { foreground: palette.constant, fontStyle: 'underline' } },
    ],
  };
}

export const lightTheme = createTheme('virentia-light', 'light', {
  bg: '#f5f0f8', text: '#302537', comment: '#6f607b', keyword: '#744399',
  string: '#286549', constant: '#9a3d59', function: '#885719', type: '#435d94',
  attribute: '#684c87', punctuation: '#65536f',
});
export const darkTheme = createTheme('virentia-dark', 'dark', {
  bg: '#100d16', text: '#d9cde4', comment: '#a99cb7', keyword: '#c9a9ee',
  string: '#b7d3bd', constant: '#e9b3bb', function: '#edc58a', type: '#b1c5ee',
  attribute: '#c7b2ef', punctuation: '#bda8d1',
});
