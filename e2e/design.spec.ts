import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('visual identity works with demo records, keyboard navigation and local assets', async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date('2026-10-17T18:00:00.000Z'));
  await page.goto('/');
  const iconPath = await page.locator('link[rel="icon"]').getAttribute('href');
  const icon = await page.request.get(iconPath!);
  expect(icon.ok()).toBe(true);
  expect(await icon.text()).toContain('<svg');
  await page.getByRole('button', { name: 'Seus dados', exact: true }).click();
  await page
    .getByLabel('Selecionar arquivo de backup')
    .setInputFiles(resolve('public/demo/fitness-lab-demo.json'));
  await page.getByRole('button', { name: 'Substituir dados e restaurar' }).click();
  await expect(page.getByText('Backup restaurado com sucesso.')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar mensagem' }).click();

  for (const name of ['Hoje', 'Treinos', 'Alimentação', 'Evolução', 'Seus dados']) {
    await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () =>
          document.fonts.check('16px Barlow') &&
          document.fonts.check('700 32px "Barlow Condensed"'),
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect
      .soft(
        scan.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
        })),
        name,
      )
      .toEqual([]);
    if (name === 'Evolução')
      await page
        .getByRole('combobox', { name: 'Exercício', exact: true })
        .selectOption('demo-exercise-bench');
    if (name === 'Hoje' || name === 'Evolução' || name === 'Alimentação') {
      await page.screenshot({
        path: testInfo.outputPath(
          `${name === 'Hoje' ? 'dashboard' : name === 'Evolução' ? 'history' : 'nutrition'}.png`,
        ),
        fullPage: true,
      });
    }
  }
  await page.reload();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeInViewport();
  if (testInfo.project.name === 'mobile') {
    await page.setViewportSize({ width: 320, height: 740 });
    for (const name of ['Hoje', 'Treinos', 'Alimentação', 'Evolução', 'Seus dados']) {
      await page.getByRole('navigation').getByRole('button', { name, exact: true }).click();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `320px: ${name}`,
      ).toBe(true);
    }
  }
});
