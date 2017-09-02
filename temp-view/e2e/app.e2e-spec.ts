import { TempViewPage } from './app.po';

describe('temp-view App', () => {
  let page: TempViewPage;

  beforeEach(() => {
    page = new TempViewPage();
  });

  it('should display welcome message', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('Welcome to app!!');
  });
});
