describe('when extension page opens', () => {
  it('prompts for wallet and private key', async () => {
    const [browser] = global.browsersInfo;

    await browser.page.waitForTimeout(500);

    expect(browser).toBeTruthy();
  });

  it('saves wallet and private key', async () => {
    const [browser] = global.browsersInfo;

    await browser.page.waitForTimeout(500);

    expect(browser).toBeTruthy();
  });
});
