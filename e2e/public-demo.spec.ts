import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { AppState } from '../src/types';

const fixturePath = resolve('public/demo/fitness-lab-demo.json');
const demoLabel = 'Demonstração · dados fictícios';
const personalExerciseName = 'Exercício pessoal fictício';
const personalFoodName = 'Alimento pessoal fictício';

function action(page: Page, name: string) {
  return page
    .getByRole('button', { name, exact: true })
    .or(page.getByRole('link', { name, exact: true }));
}

async function navigate(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name, exact: true })
    .click();
  await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
}

async function fixture(): Promise<AppState> {
  return JSON.parse(await readFile(fixturePath, 'utf8')) as AppState;
}

async function exportBackup(page: Page) {
  await navigate(page, 'Seus dados');
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup', exact: true }).click();
  const download = await pendingDownload;
  const path = await download.path();
  expect(path).toBeTruthy();
  return {
    filename: download.suggestedFilename(),
    state: JSON.parse(await readFile(path!, 'utf8')) as AppState,
  };
}

async function createPersonalRecords(page: Page) {
  await navigate(page, 'Treinos');
  await page.getByRole('button', { name: 'Cadastrar exercício', exact: true }).click();
  await page.getByLabel('Nome do exercício', { exact: true }).fill(personalExerciseName);
  await page.getByLabel('Grupo muscular', { exact: true }).fill('Pernas');
  await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: personalExerciseName, exact: true }),
  ).toBeVisible();
  await navigate(page, 'Alimentação');
  await page.getByRole('button', { name: 'Cadastrar alimento', exact: true }).click();
  await fillFood(page, personalFoodName);
  await page.getByRole('button', { name: 'Salvar alimento', exact: true }).click();
  await expect(page.getByRole('heading', { name: personalFoodName, exact: true })).toBeVisible();
}

async function fillFood(page: Page, name: string) {
  await page.getByLabel('Nome do alimento', { exact: true }).fill(name);
  await page.getByLabel('Energia (kcal)', { exact: true }).fill('120');
  await page.getByLabel('Proteína (g)', { exact: true }).fill('10');
  await page.getByLabel('Carboidratos (g)', { exact: true }).fill('20');
  await page.getByLabel('Gorduras (g)', { exact: true }).fill('0');
}

async function enterDemo(page: Page) {
  await action(page, 'Experimentar demonstração').click();
  await expect(page).toHaveURL((url) => url.searchParams.get('mode') === 'demo');
  await expect(page.getByText(demoLabel, { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hoje', level: 1, exact: true })).toBeVisible();
}

async function leaveDemo(page: Page) {
  await action(page, 'Voltar ao modo pessoal').click();
  await expect(page).toHaveURL((url) => url.searchParams.get('mode') !== 'demo');
  await expect(page.getByText(demoLabel, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Hoje', level: 1, exact: true })).toBeVisible();
}

test('public demo supports a full visit while preserving personal records and explicit reset', async ({
  page,
}) => {
  test.setTimeout(120_000);
  // The reference diary day must stay distinct from the clock used by a new workout.
  await page.clock.setFixedTime(new Date('2026-10-29T18:00:00.000Z'));
  const seedRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/demo/fitness-lab-demo.json')) {
      seedRequests.push(request.url());
    }
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Hoje', level: 1, exact: true })).toBeVisible();
  const root = new URL(page.url());
  await expect(page.getByText(demoLabel, { exact: true })).toHaveCount(0);
  await createPersonalRecords(page);
  const personal = await exportBackup(page);
  expect(personal.filename).toMatch(/^fitness-lab-backup-.*\.json$/);
  expect(personal.state.exercises.map((exercise) => exercise.name)).toEqual([personalExerciseName]);
  expect(personal.state.foods.map((food) => food.name)).toEqual([personalFoodName]);
  expect(seedRequests).toEqual([]);

  await enterDemo(page);
  expect(new URL(page.url()).pathname).toBe(root.pathname);
  const original = await fixture();
  expect((await exportBackup(page)).state).toEqual(original);
  expect(seedRequests.length).toBeGreaterThan(0);
  expect(seedRequests.every((url) => new URL(url).pathname.startsWith(root.pathname))).toBe(true);

  await navigate(page, 'Hoje');
  await expect(page.locator('.page-heading')).toContainText('17 de outubro de 2026');
  await action(page, 'Explorar evolução').click();
  await expect(page.getByRole('combobox', { name: 'Exercício', exact: true })).toHaveValue(
    'demo-exercise-bench',
  );
  const progression = page.getByLabel('Evolução cronológica do exercício');
  await expect(progression.locator('.progression-row')).toHaveCount(12);
  await expect(progression.locator('.progression-row').first()).toContainText('30 kg');
  await expect(progression.locator('.progression-row').last()).toContainText('35 kg');

  await navigate(page, 'Hoje');
  await action(page, 'Experimentar um treino').click();
  const routine = page.locator('.routine-card').filter({
    has: page.getByRole('heading', { name: original.routines[0].name, exact: true }),
  });
  await routine.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  const firstExercise = page.locator('.exercise-card').first();
  await firstExercise.getByLabel('Repetições da série 1', { exact: true }).fill('11');
  await firstExercise.getByLabel('Carga em kg da série 1', { exact: true }).fill('22');
  await action(page, 'Voltar ao modo pessoal').click();
  await expect(page).toHaveURL((url) => url.searchParams.get('mode') === 'demo');
  await action(page, 'Restaurar exemplos').click();
  await expect(firstExercise.getByLabel('Carga em kg da série 1', { exact: true })).toHaveValue(
    '22',
  );
  await expect(
    page.getByRole('region', { name: 'Confirmar restauração dos exemplos', exact: true }),
  ).toHaveCount(0);
  await firstExercise
    .getByRole('button', { name: 'Salvar rascunho da série 1', exact: true })
    .click();
  await expect(page.getByText('Alterações ainda não salvas', { exact: true })).toHaveCount(0);
  await page.reload();
  await navigate(page, 'Treinos');
  await expect(firstExercise.getByLabel('Repetições da série 1', { exact: true })).toHaveValue(
    '11',
  );
  await expect(firstExercise.getByLabel('Carga em kg da série 1', { exact: true })).toHaveValue(
    '22',
  );
  await firstExercise.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(firstExercise.getByRole('button', { name: 'Feita', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await navigate(page, 'Evolução');
  const latestWorkout = page.locator('.history-card').first();
  await latestWorkout.getByRole('button').first().click();
  await expect(latestWorkout.getByRole('cell', { name: '22 kg', exact: true })).toBeVisible();
  await expect(latestWorkout.getByRole('cell', { name: '11', exact: true })).toBeVisible();

  await navigate(page, 'Hoje');
  await action(page, 'Editar alimentação').click();
  await expect(page.getByLabel('Data do diário alimentar', { exact: true })).toHaveValue(
    '2026-10-17',
  );
  await page
    .getByRole('combobox', { name: 'Alimento', exact: true })
    .selectOption('demo-food-taco-3');
  await page.getByLabel('Quantidade (g)', { exact: true }).fill('100');
  await page.getByRole('combobox', { name: 'Refeição', exact: true }).selectOption('Lanche');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  const snack = page
    .locator('.meal-group')
    .filter({ has: page.getByRole('heading', { name: 'Lanche', exact: true }) });
  await expect(snack.locator('.meal-entry')).toContainText('128 kcal');
  await snack
    .getByRole('button', { name: `Editar consumo de ${original.foods[0].name}`, exact: true })
    .click();
  const mealEditor = page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Editar consumo', exact: true }) });
  await mealEditor.getByLabel('Quantidade (g)', { exact: true }).fill('150');
  await page.getByRole('button', { name: 'Salvar consumo', exact: true }).click();
  await expect(snack.locator('.meal-entry')).toContainText('192 kcal');
  const energy = page
    .locator('.nutrient-stats .stat-card')
    .filter({ has: page.getByText('Energia', { exact: true }) });
  await expect(energy).toContainText('1.238,9');
  const changed = await exportBackup(page);
  expect(changed.filename).toMatch(/^fitness-lab-demo-backup-.*\.json$/);
  expect(changed.state.sessions).toHaveLength(25);
  expect(changed.state.meals).toHaveLength(927);
  const newWorkout = changed.state.sessions.find(
    (session) => !original.sessions.some((seed) => seed.id === session.id),
  );
  expect(newWorkout?.day).toBe('2026-10-29');
  expect(newWorkout?.startedAt).toBe('2026-10-29T18:00:00.000Z');
  expect(newWorkout?.exercises[0].sets[0]).toMatchObject({ reps: 11, weight: 22, completed: true });

  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
  await enterDemo(page);
  expect((await exportBackup(page)).state).toEqual(changed.state);
  await page.reload();
  expect((await exportBackup(page)).state).toEqual(changed.state);

  await action(page, 'Restaurar exemplos').click();
  const reset = page.getByRole('region', {
    name: 'Confirmar restauração dos exemplos',
    exact: true,
  });
  await expect(reset).toBeVisible();
  await reset.getByRole('button', { name: 'Cancelar restauração', exact: true }).click();
  await expect(reset).toHaveCount(0);
  expect((await exportBackup(page)).state).toEqual(changed.state);
  await action(page, 'Restaurar exemplos').click();
  await reset.getByRole('button', { name: 'Restaurar dados fictícios', exact: true }).click();
  await expect(reset).toHaveCount(0);
  expect((await exportBackup(page)).state).toEqual(original);
  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
});

test('demo entry, assets and reset controls work with keyboard and accessible layouts', async ({
  page,
}, testInfo) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Experimentar demonstração', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Hoje', level: 1, exact: true })).toBeVisible();
  await expect(page.getByText(demoLabel, { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () =>
        document.fonts.check('16px Barlow') && document.fonts.check('700 32px "Barlow Condensed"'),
    ),
  ).toBe(true);
  const assetPaths = await page
    .locator('link[rel="icon"], img')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? node.getAttribute('src')),
    );
  for (const path of assetPaths) {
    const response = await page.request.get(new URL(path!, page.url()).href);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  }
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('public-demo-dashboard.png'), fullPage: true });
  await action(page, 'Explorar evolução').click();
  await page.screenshot({
    path: testInfo.outputPath('public-demo-evolution.png'),
    fullPage: false,
  });
  await action(page, 'Restaurar exemplos').click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole('button', { name: 'Cancelar restauração', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Confirmar restauração dos exemplos', exact: true }),
  ).toHaveCount(0);
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 740 });
  for (const name of ['Hoje', 'Treinos', 'Alimentação', 'Evolução', 'Seus dados']) {
    await navigate(page, name);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('importing a backup in the demo replaces only the demo database after confirmation', async ({
  page,
}) => {
  await page.goto('./');
  await createPersonalRecords(page);
  const personal = await exportBackup(page);
  await enterDemo(page);
  const original = await fixture();
  const imported = structuredClone(original);
  imported.foods[0].name = 'Alimento fictício importado para a demo';
  await navigate(page, 'Seus dados');
  await page.getByLabel('Selecionar arquivo de backup', { exact: true }).setInputFiles({
    name: 'synthetic-demo-import.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  const confirmation = page.getByRole('region', { name: 'Confirmar restauração', exact: true });
  await expect(confirmation).toBeVisible();
  expect((await exportBackup(page)).state).toEqual(original);
  await confirmation
    .getByRole('button', { name: 'Substituir dados e restaurar', exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  expect((await exportBackup(page)).state).toEqual(imported);
  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
  await enterDemo(page);
  expect((await exportBackup(page)).state).toEqual(imported);
});

test('a failed initial demo download keeps personal data intact and can be retried', async ({
  page,
}) => {
  await page.goto('./');
  await createPersonalRecords(page);
  const personal = await exportBackup(page);
  const seedPath = '**/demo/fitness-lab-demo.json';
  await page.route(seedPath, (route) => route.abort('failed'));
  await action(page, 'Experimentar demonstração').click();
  await expect(page).toHaveURL((url) => url.searchParams.get('mode') === 'demo');
  await expect(
    page.getByRole('alert').filter({ hasText: /carregar|demonstração|exemplos|conexão/i }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hoje', exact: true })).toHaveCount(0);
  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
  await page.unroute(seedPath);
  await enterDemo(page);
  expect((await exportBackup(page)).state).toEqual(await fixture());
});

test('demo quota failures do not fall back to personal data or acknowledge unsaved changes', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const flag = '__fitness_lab_e2e_demo_quota';
    if (sessionStorage.getItem(flag) === null) sessionStorage.setItem(flag, 'on');
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (
        this.transaction.db.name === 'fitness-lab-demo' &&
        sessionStorage.getItem(flag) === 'on'
      ) {
        throw new DOMException(
          'Simulated quota failure in the isolated demo database.',
          'QuotaExceededError',
        );
      }
      return Reflect.apply(originalPut, this, args);
    };
  });
  await page.goto('./');
  await createPersonalRecords(page);
  const personal = await exportBackup(page);
  await action(page, 'Experimentar demonstração').click();
  await expect(
    page.getByRole('alert').filter({ hasText: /espaço|quota|carregar|armazenamento/i }),
  ).toBeVisible();
  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
  await page.evaluate(() => sessionStorage.setItem('__fitness_lab_e2e_demo_quota', 'off'));
  await enterDemo(page);
  const original = (await exportBackup(page)).state;
  expect(original).toEqual(await fixture());

  await page.evaluate(() => sessionStorage.setItem('__fitness_lab_e2e_demo_quota', 'on'));
  await navigate(page, 'Alimentação');
  await page.getByRole('button', { name: 'Meus alimentos', exact: true }).click();
  await page.getByRole('button', { name: 'Novo alimento', exact: true }).click();
  await fillFood(page, 'Alimento fictício que não deve ser salvo');
  await page.getByRole('button', { name: 'Salvar alimento', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: /espaço|quota/i })).toBeVisible();
  await expect(page.getByLabel('Nome do alimento', { exact: true })).toHaveValue(
    'Alimento fictício que não deve ser salvo',
  );
  expect((await exportBackup(page)).state).toEqual(original);
  await leaveDemo(page);
  expect((await exportBackup(page)).state).toEqual(personal.state);
  await page.evaluate(() => sessionStorage.setItem('__fitness_lab_e2e_demo_quota', 'off'));
  await enterDemo(page);
  expect((await exportBackup(page)).state).toEqual(original);
});
