import { readFile } from 'fs'
import { parse as parseEnvFile } from 'dotenv'
import { resolve as resolvePath } from 'path'
import { exec, ChildProcess } from 'child_process'

import { RejectFn, ResolveFn } from '../src/typings/promise-helper.d'
import { IOptions } from '../src/typings/options'

function killHostProcess(code: number = 0): void {
    process.exit(code)
}

function terminateChildProcess(childProcess: ChildProcess, signal: NodeJS.Signals): void {
    if (!childProcess.disconnect && !childProcess.killed) {
        childProcess.kill(signal)
    }
}

function pipeSignalChildProcess(childProcess: ChildProcess): (signal?: string) => void {
    return (signal: NodeJS.Signals = 'SIGTERM'): void => {
        terminateChildProcess(childProcess, signal)
    }
}

function killChildProcess(childProcess: ChildProcess): () => void {
    return () => {
        terminateChildProcess(childProcess, 'SIGTERM')

        const timer = setTimeout(() => {
            terminateChildProcess(childProcess, 'SIGKILL')
        }, 5000)

        childProcess.once('exit', () => {
            clearTimeout(timer)
        })
    }
}

function loadEnvFile(path: string): Promise<string> {
    return new Promise((resolve: ResolveFn<string>, reject: RejectFn) => {
        readFile(
            path,
            { encoding: 'utf8' },
            (err: Error, data: string) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            }
        )
    })
}

function writeChunk(stdErr: boolean): (chunk: Buffer | string) => void {
    if (stdErr) {
        return (chunk: Buffer | string) => {
            process.stderr.write(chunk)
        }
    }

    return (chunk: Buffer | string) => {
        process.stdout.write(chunk)
    }
}

function runCommand(cmd: string, env: object, timeout: number): ChildProcess {
    const childProcess = exec(cmd, {
        cwd: process.cwd(),
        encoding: 'utf8',
        env,
        timeout
    })

    const pipeSignal = pipeSignalChildProcess(childProcess)
    const killProcess = killChildProcess(childProcess)

    childProcess.stderr.on('data', writeChunk(true))
    childProcess.stdout.on('data', writeChunk(false))
    childProcess.once('error', (err) => console.error(err))
    process.once('beforeExit', killProcess)
    process.once('uncaughtException', killProcess)
    process.once('unhandledRejection', killProcess)
    process.once('SIGTERM', pipeSignal)
    process.once('SIGINT', pipeSignal)
    process.once('SIGBREAK', pipeSignal)
    process.once('SIGHUP', pipeSignal)

    return childProcess
}

function mergeEnv(env: object, preferParentEnv: boolean): object {
    const keys = Object.keys(env)
    const mergedEnv: object = {}

    for (const key of keys) {
        if (preferParentEnv && process.env[key]) {
            mergedEnv[key] = process.env[key]
        } else {
            mergedEnv[key] = env[key]
        }
    }

    return mergedEnv
}

export default async function envCommand(
    cmd: string,
    options?: IOptions
): Promise<ChildProcess> {
    const envFilePath = (options && options.envFilePath) || '.env'
    const closeAfterFinish = options && options.closeAfterFinish === true

    const childProcess = runCommand(
        cmd,
        mergeEnv(
            parseEnvFile(
                await loadEnvFile(resolvePath(process.cwd(), envFilePath))
            ),
            options && options.preferParentEnv === true
        ),
        (options && typeof options.timeout === 'number') ? options.timeout : 0
    )

    if (closeAfterFinish) {
        childProcess.once('exit', killHostProcess)
    }

    return childProcess
}
