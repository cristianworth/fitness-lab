import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function navigate(page: Page, name: string) {
  await page
    .getByRole('navigation', { name: 'Navegação principal' })
    .getByRole('button', { name, exact: true })
    .click();
}

async function createWorkout(page: Page) {
  await navigate(page, 'Treinos');
  await page.getByRole('button', { name: 'Cadastrar exercício', exact: true }).click();
  await page.getByLabel('Nome do exercício', { exact: true }).fill('Agachamento de teste');
  await page.getByLabel('Grupo muscular', { exact: true }).fill('Pernas');
  await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Agachamento de teste', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Rotinas', exact: true }).click();
  await page.getByRole('button', { name: 'Nova rotina', exact: true }).click();
  await page.getByLabel('Nome da rotina', { exact: true }).fill('Treino A de teste');
  await page
    .getByRole('combobox', { name: 'Adicionar exercício', exact: true })
    .selectOption({ label: 'Agachamento de teste' });
  await page.getByLabel('Séries', { exact: true }).fill('2');
  await page.getByLabel('Repetições', { exact: true }).fill('10');
  await page.getByRole('button', { name: 'Salvar rotina', exact: true }).click();
  await page.getByRole('button', { name: 'Iniciar treino', exact: true }).click();
  await expect(page.getByText('EM ANDAMENTO', { exact: false })).toBeVisible();
}

test('workout draft survives reload, completion builds history, snapshots survive edits', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await createWorkout(page);
  await page.getByLabel('Carga em kg da série 1', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Salvar rascunho da série 1', exact: true }).click();
  await expect(page.getByText('Alterações ainda não salvas', { exact: false })).toHaveCount(0);
  await page.reload();
  await navigate(page, 'Treinos');
  await expect(page.getByLabel('Carga em kg da série 1', { exact: true })).toHaveValue('30');
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(page.getByRole('button', { name: 'Feita', exact: true })).toHaveCount(1);
  await page.screenshot({ path: testInfo.outputPath('active-workout.png'), fullPage: true });
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await expect(page.getByText('EM ANDAMENTO', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Exercícios', exact: true }).click();
  await page.getByRole('button', { name: 'Editar Agachamento de teste', exact: true }).click();
  await page
    .getByLabel('Nome do exercício', { exact: true })
    .fill('Nome novo para sessões futuras');
  await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
  await navigate(page, 'Evolução');
  await page.getByRole('button', { name: /Treino A de teste/ }).click();
  await expect(page.getByRole('heading', { name: /Agachamento de teste/ })).toBeVisible();
  await expect(page.getByRole('cell', { name: '30 kg', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'Não feita', exact: true })).toHaveCount(1);
  await page.getByRole('combobox', { name: 'O que observar', exact: true }).selectOption('volume');
  await expect(page.getByLabel('Evolução cronológica do exercício')).toContainText('300');
  await page.reload();
  await navigate(page, 'Evolução');
  await expect(page.getByRole('button', { name: /Treino A de teste/ })).toHaveCount(1);
});

test('nutrition scales values and preserves snapshots during food and daily corrections', async ({
  page,
}) => {
  await page.goto('/');
  await navigate(page, 'Alimentação');
  await page.getByRole('button', { name: 'Cadastrar alimento', exact: true }).click();
  await page.getByLabel('Nome do alimento', { exact: true }).fill('Alimento fictício de teste');
  await page.getByLabel('Energia (kcal)', { exact: true }).fill('120');
  await page.getByLabel('Proteína (g)', { exact: true }).fill('10');
  await page.getByLabel('Carboidratos (g)', { exact: true }).fill('20');
  await page.getByLabel('Gorduras (g)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Salvar alimento', exact: true }).click();
  await page.getByRole('button', { name: 'Diário alimentar', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Alimento', exact: true })
    .selectOption({ label: 'Alimento fictício de teste (g)' });
  await page.getByLabel('Quantidade (g)', { exact: true }).fill('150');
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  await expect(page.locator('.meal-entry')).toHaveCount(1);
  await expect(page.locator('.meal-entry')).toContainText('180 kcal');
  await expect(page.locator('.meal-entry')).toContainText('P 15 g');
  await page.getByRole('button', { name: 'Meus alimentos', exact: true }).click();
  await page
    .getByRole('button', { name: 'Editar Alimento fictício de teste', exact: true })
    .click();
  await page.getByLabel('Energia (kcal)', { exact: true }).fill('999');
  await page.getByRole('button', { name: 'Salvar alimento', exact: true }).click();
  await page.getByRole('button', { name: 'Diário alimentar', exact: true }).click();
  await expect(page.locator('.meal-entry')).toContainText('180 kcal');
  await page
    .getByRole('button', { name: 'Editar consumo de Alimento fictício de teste', exact: true })
    .click();
  const editor = page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Editar consumo', exact: true }) });
  await editor.getByLabel('Quantidade (g)', { exact: true }).fill('200');
  await editor.getByLabel('Data', { exact: true }).fill('2026-10-16');
  await page.getByRole('button', { name: 'Salvar consumo', exact: true }).click();
  await page.getByLabel('Data do diário alimentar', { exact: true }).fill('2026-10-16');
  await expect(page.locator('.meal-entry')).toContainText('240 kcal');
  await page.reload();
  await navigate(page, 'Alimentação');
  await page.getByLabel('Data do diário alimentar', { exact: true }).fill('2026-10-16');
  await expect(page.locator('.meal-entry')).toHaveCount(1);
  await expect(page.locator('.meal-entry')).toContainText('240 kcal');
  await page
    .getByRole('button', { name: 'Remover consumo de Alimento fictício de teste', exact: true })
    .click();
  await page.getByRole('button', { name: 'Sim, remover', exact: true }).click();
  await expect(page.locator('.meal-entry')).toHaveCount(0);
});

test('backup exports, rejects invalid files and recovers a corrupt local database', async ({
  page,
}) => {
  await page.goto('/');
  await createWorkout(page);
  await navigate(page, 'Seus dados');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar backup', exact: true }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  expect(backupPath).toBeTruthy();
  await page.getByLabel('Selecionar arquivo de backup', { exact: true }).setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"schemaVersion":999}'),
  });
  await expect(page.getByRole('alert')).toContainText('Dados inválidos');
  await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('fitness-lab', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction('state', 'readwrite');
      transaction.objectStore('state').put({ corrupted: true }, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Vamos recuperar a conexão com seus dados', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Selecionar arquivo de backup', { exact: true }).setInputFiles(backupPath!);
  await expect(page.getByText('O arquivo contém', { exact: false })).toContainText('1 treinos');
  await page.getByRole('button', { name: 'Substituir dados e restaurar', exact: true }).click();
  await navigate(page, 'Treinos');
  await expect(page.getByText('EM ANDAMENTO', { exact: false })).toBeVisible();
});

test('all main screens fit the viewport and render without application errors', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  for (const name of ['Hoje', 'Treinos', 'Alimentação', 'Evolução', 'Seus dados']) {
    await navigate(page, name);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    if (name === 'Hoje')
      await page.screenshot({ path: testInfo.outputPath('dashboard.png'), fullPage: true });
  }
  expect(errors).toEqual([]);
});

test('series synchronize between tabs and detect conflicting local drafts', async ({
  page,
  context,
}) => {
  await page.goto('/');
  await createWorkout(page);
  const other = await context.newPage();
  await other.goto('/');
  await navigate(other, 'Treinos');
  await page.getByLabel('Carga em kg da série 1', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(other.getByLabel('Carga em kg da série 1', { exact: true })).toHaveValue('20');
  await other.getByLabel('Carga em kg da série 1', { exact: true }).fill('25');
  await page.getByLabel('Carga em kg da série 1', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(other.getByText('Esta série mudou em outra aba.', { exact: false })).toBeVisible();
  await expect(other.getByRole('button', { name: 'Finalizar treino', exact: true })).toBeDisabled();
  await other.getByRole('button', { name: 'Carregar registro salvo', exact: true }).click();
  await expect(other.getByLabel('Carga em kg da série 1', { exact: true })).toHaveValue('30');
  await other.getByLabel('Carga em kg da série 1', { exact: true }).fill('35');
  await page.getByRole('button', { name: 'Finalizar treino', exact: true }).click();
  await expect(other.getByText('EM ANDAMENTO', { exact: false })).toHaveCount(0);
  await navigate(other, 'Evolução');
  await expect(
    other.getByRole('heading', { name: 'Olhe o quanto você já fez.', exact: true }),
  ).toBeVisible();
});

test('main screens and workout editor have no detected WCAG A or AA violations', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  for (const name of ['Hoje', 'Treinos', 'Alimentação', 'Evolução', 'Seus dados']) {
    await navigate(page, name);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect
      .soft(
        scan.violations.map((issue) => ({
          id: issue.id,
          nodes: issue.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
        })),
        name,
      )
      .toEqual([]);
  }
  await createWorkout(page);
  const scan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    scan.violations.map((issue) => ({
      id: issue.id,
      nodes: issue.nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
    })),
    'Editor de séries',
  ).toEqual([]);
});
