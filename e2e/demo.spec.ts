import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

test('demo imports, shows progression, persists and exports without losing records', async ({
  page,
}) => {
  const fixturePath = resolve('public/demo/fitness-lab-demo.json');
  const original = JSON.parse(await readFile(fixturePath, 'utf8'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Seus dados', exact: true }).click();
  await page.getByLabel('Selecionar arquivo de backup').setInputFiles(fixturePath);
  await expect(page.getByRole('region', { name: 'Confirmar restauração' })).toContainText('926');
  await page.getByRole('button', { name: 'Substituir dados e restaurar' }).click();
  await expect(page.getByText('Backup restaurado com sucesso.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Evolução', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Exercício', exact: true })
    .selectOption('demo-exercise-bench');
  const progression = page.getByLabel('Evolução cronológica do exercício');
  await expect(progression.locator('.progression-row')).toHaveCount(12);
  await expect(progression.locator('.progression-row').first()).toContainText('30 kg');
  await expect(progression.locator('.progression-row').last()).toContainText('35 kg');
  await page.getByRole('combobox', { name: 'O que observar', exact: true }).selectOption('volume');
  await expect(progression.locator('.progression-row').first()).toContainText('540');
  await page.getByRole('button', { name: 'Seus dados', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup' }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(JSON.parse(await readFile(downloadPath!, 'utf8'))).toEqual(original);
});
