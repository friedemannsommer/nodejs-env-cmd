import { readFile } from 'fs'
import { parse as parseEnvFile } from 'dotenv'
import { resolve as resolvePath } from 'path'
import { ChildProcess } from 'child_process'
import * as spawn from 'cross-spawn'

import { RejectFn, ResolveFn } from '../src/typings/promise-helper.d'
import { IOptions } from '../src/typings/options'

const defaultOptions: IOptions = {
    closeAfterFinish: false,
    envFilePath: '.env',
    preferParentEnv: false,
    inheritParentEnv: true,
    pipeOutput: true,
    timeout: 0
}

function getOptions(rawOptions?: Partial<IOptions>): IOptions {
    return Object.assign({}, defaultOptions, rawOptions)
}

function killHostProcess(code: number = 0): void {
    process.exit(code)
}

function terminateChildProcess(childProcess: ChildProcess, signal: NodeJS.Signals): void {
    if (!childProcess.disconnect && !childProcess.killed) {
        childProcess.kill(signal)
    }
}

function pipeSignalChildProcess(childProcess: ChildProcess): (signal?: NodeJS.Signals) => void {
    return (signal: NodeJS.Signals = 'SIGTERM'): void => {
        terminateChildProcess(childProcess, signal)
    }
}

function cancelTimer(timer: NodeJS.Timer): () => void {
    return () => {
        clearTimeout(timer)
    }
}

function killChildProcess(childProcess: ChildProcess): () => void {
    return () => {
        terminateChildProcess(childProcess, 'SIGTERM')

        const timer = setTimeout(() => {
            terminateChildProcess(childProcess, 'SIGKILL')
        }, 5000)

        childProcess.once('exit', cancelTimer(timer))
    }
}

function killChildProcessOnTimeout(childProcess: ChildProcess, timeout: number): void {
    const timer = setTimeout(killChildProcess(childProcess), timeout)

    childProcess.once('exit', cancelTimer(timer))
    childProcess.once('close', cancelTimer(timer))
}

function loadEnvFile(path: string): Promise<string> {
    return new Promise((resolve: ResolveFn<string>, reject: RejectFn) => {
        readFile(
            path,
            { encoding: 'utf8' },
            (err: Error | null, data: string) => {
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

function runCommand(cmd: string, env: NodeJS.ProcessEnv, options: IOptions): ChildProcess {
    const parts = cmd.split(' ')
    const bin = parts[0]
    const childProcess = spawn(bin, parts.slice(1), {
        cwd: process.cwd(),
        env,
        shell: true,
        windowsHide: true
    })

    const pipeSignal = pipeSignalChildProcess(childProcess)
    const killProcess = killChildProcess(childProcess)

    if (options.pipeOutput !== false) {
        if (childProcess.stderr) {
            childProcess.stderr.on('data', writeChunk(true))
        }

        if (childProcess.stdout) {
            childProcess.stdout.on('data', writeChunk(false))
        }

        childProcess.once('error', (err: Error) => console.error(err))
    }

    process.once('beforeExit', killProcess)
    process.once('uncaughtException', killProcess)
    process.once('unhandledRejection', killProcess)
    process.once('SIGTERM', pipeSignal)
    process.once('SIGINT', pipeSignal)
    process.once('SIGBREAK', pipeSignal)
    process.once('SIGHUP', pipeSignal)

    if (options.timeout > 0 && isFinite(options.timeout)) {
        killChildProcessOnTimeout(childProcess, options.timeout)
    }

    return childProcess
}

function mergeEnv(env: object, options: IOptions): object {
    const childEnvKeys = Object.keys(env)
    const parentEnv = process.env
    const mergedEnv: { [key: string]: unknown } = {}

    if (options.inheritParentEnv) {
        const parentEnvKeys = Object.keys(parentEnv)

        for (const key of parentEnvKeys) {
            mergedEnv[key] = parentEnv[key]
        }
    }

    for (const key of childEnvKeys) {
        if (options.preferParentEnv && typeof parentEnv[key] !== 'undefined') {
            mergedEnv[key] = parentEnv[key]
        } else {
            mergedEnv[key] = env[key]
        }
    }

    return mergedEnv
}

export default async function envCommand(
    cmd: string,
    rawOptions?: Partial<IOptions>
): Promise<ChildProcess> {
    const options = getOptions(rawOptions)
    const childProcess = runCommand(
        cmd,
        mergeEnv(
            parseEnvFile(
                await loadEnvFile(resolvePath(process.cwd(), options.envFilePath))
            ),
            options
        ) as NodeJS.ProcessEnv,
        options
    )

    if (options.closeAfterFinish) {
        childProcess.once('exit', killHostProcess)
    }

    return childProcess
}
