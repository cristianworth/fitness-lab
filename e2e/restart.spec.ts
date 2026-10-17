import { test, expect } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

async function startServer(port: number): Promise<ChildProcess> {
  const server = spawn(process.execPath, [resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], { stdio: 'pipe', windowsHide: true });
  await new Promise<void>((done, reject) => {
    const timer = setTimeout(() => { server.kill(); reject(new Error('Preview server did not become ready.')); }, 15000);
    server.on('error', error => { clearTimeout(timer); reject(error); });
    server.on('exit', code => { clearTimeout(timer); reject(new Error(`Preview server exited (${code}).`)); });
    server.stdout?.on('data', (data: Buffer) => { if (data.toString().includes('Local:')) { clearTimeout(timer); done(); } });
  });
  return server;
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  await new Promise<void>(done => { server.once('exit', () => done()); server.kill(); });
}

test('saved records survive stopping and restarting the application server', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  const port = testInfo.project.name === 'mobile' ? 5182 : 5181;
  let server = await startServer(port);
  try {
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByRole('button', { name: 'Treinos', exact: true }).click();
    await page.getByRole('button', { name: 'Cadastrar exercício', exact: true }).click();
    await page.getByLabel('Nome do exercício', { exact: true }).fill('Exercício fictício persistido');
    await page.getByLabel('Grupo muscular', { exact: true }).fill('Teste de reinicialização');
    await page.getByRole('button', { name: 'Salvar exercício', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Exercício fictício persistido', exact: true })).toBeVisible();
    await stopServer(server);
    server = await startServer(port);
    await page.reload();
    await page.getByRole('button', { name: 'Treinos', exact: true }).click();
    await page.getByRole('button', { name: 'Exercícios', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Exercício fictício persistido', exact: true })).toBeVisible();
  } finally { await stopServer(server); }
});
