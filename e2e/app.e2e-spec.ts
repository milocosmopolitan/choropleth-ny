import { ChoroplethNyPage } from './app.po';

describe('choropleth-ny App', () => {
  let page: ChoroplethNyPage;

  beforeEach(() => {
    page = new ChoroplethNyPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!');
  });
});
