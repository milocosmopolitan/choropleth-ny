import { browser, by, element } from 'protractor';

export class ChoroplethNyPage {
  navigateTo() {
    return browser.get('/');
  }

  getParagraphText() {
    return element(by.css('app-root h1')).getText();
  }
}
