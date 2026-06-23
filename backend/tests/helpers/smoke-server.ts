import { type ChildProcess, spawn } from 'node:child_process'
import net from 'node:net'

export async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close(() => resolve(port))
    })
  })
}

async function waitForServer(
  process: ChildProcess,
  graphqlUrl: string,
  getStartupError: () => string,
) {
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Servidor encerrou antes de ficar pronto: ${getStartupError()}`)
    }

    const startupError = getStartupError()
    if (startupError.includes('EADDRINUSE')) {
      throw new Error(`Porta em uso: ${startupError}`)
    }

    try {
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '{ _health }' }),
      })

      if (response.ok) return
    } catch {
      // servidor ainda subindo
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  throw new Error(`Timeout aguardando servidor HTTP: ${getStartupError()}`)
}

export async function startSmokeServer(backendRoot: string) {
  const port = await getFreePort()
  const graphqlUrl = `http://127.0.0.1:${port}/graphql`
  let startupError = ''

  const serverProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: backendRoot,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
  })

  serverProcess.stderr?.on('data', (chunk: Buffer) => {
    startupError += chunk.toString()
  })

  await waitForServer(serverProcess, graphqlUrl, () => startupError)

  return { graphqlUrl, serverProcess }
}

export function stopSmokeServer(serverProcess: ChildProcess) {
  if (!serverProcess.killed) {
    serverProcess.kill()
  }
}
