import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

async function startServer(port: number): Promise<ChildProcess> {
  const server = spawn(
    process.execPath,
    [
      resolve('node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    { stdio: 'pipe', windowsHide: true },
  );
  let output = '';
  let launchError: Error | undefined;
  server.on('error', (error) => {
    launchError = error;
  });
  server.stdout?.on('data', (data: Buffer) => {
    output += data.toString();
  });
  server.stderr?.on('data', (data: Buffer) => {
    output += data.toString();
  });
  try {
    await expect
      .poll(
        async () => {
          if (launchError || server.exitCode !== null) return false;
          try {
            const response = await fetch(`http://127.0.0.1:${port}`, {
              signal: AbortSignal.timeout(1000),
            });
            return response.ok && (await response.text()).includes('Fitness Lab');
          } catch {
            return false;
          }
        },
        { timeout: 15000, message: 'Preview server must respond over HTTP.' },
      )
      .toBe(true);
  } catch (error) {
    server.kill();
    throw new Error(
      `Preview server did not become ready. ${launchError?.message ?? ''}\n${output}`,
      { cause: error },
    );
  }
  return server;
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  await new Promise<void>((done) => {
    server.once('exit', () => done());
    server.kill();
  });
}

test('saved records survive stopping and restarting the application server', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  const port = testInfo.project.name === 'mobile' ? 5182 : 5181;
  let server = await startServer(port);
  try {
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByRole('button', { name: 'Treinos', exact: true }).click();
    await page.getByRole('button', { name: 'Cadastrar exercício', exact: true }).click();
    await page
      .getByLabel('Nome do exercício', { exact: true })
      .fill('Exercício fictício persistido');
    await page.getByLabel('Grupo muscular', { exact: true }).fill('Teste de reinicialização');
    await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Exercício fictício persistido', exact: true }),
    ).toBeVisible();
    // Leave the Vite client before restart so its automatic reconnect cannot race navigation.
    await page.goto('about:blank');
    await stopServer(server);
    server = await startServer(port);
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByRole('button', { name: 'Treinos', exact: true }).click();
    await page.getByRole('button', { name: 'Exercícios', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Exercício fictício persistido', exact: true }),
    ).toBeVisible();
  } finally {
    await stopServer(server);
  }
});
