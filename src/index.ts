import { readFile } from 'fs'
import { parse as parseEnvFile } from 'dotenv'
import { resolve as resolvePath } from 'path'
import { exec, ChildProcess } from 'child_process'

import { RejectFn, ResolveFn } from '../src/typings/promise-helper.d'
import { IOptions } from '../src/typings/options'

interface IChildProcess extends ChildProcess {
    hasExited: boolean
}

function killChildProcess(childProcess: IChildProcess): (signal?: string) => () => void {
    return (signal: NodeJS.Signals = 'SIGTERM'): () => void => {
        return () => {
            if (!childProcess.hasExited) {
                childProcess.kill(signal)
            }
        }
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

function runCommand(cmd: string, env: object, timeout: number): ChildProcess {
    const childProcess = exec(cmd, {
        cwd: process.cwd(),
        env,
        encoding: 'utf8',
        timeout
    }) as IChildProcess

    childProcess.hasExited = false

    const killProcess = killChildProcess(childProcess)

    childProcess.stderr.on('data', console.error)
    childProcess.stdout.on('data', console.log)
    childProcess.once('exit', () => childProcess.hasExited = true)
    childProcess.once('error', (err) => console.error(err))
    process.once('beforeExit', killProcess())
    process.once('uncaughtException', killProcess())
    process.once('unhandledRejection', killProcess())
    process.once('SIGTERM', killProcess())
    process.once('SIGINT', killProcess('SIGINT'))
    process.once('SIGBREAK', killProcess('SIGBREAK'))
    process.once('SIGHUP', killProcess('SIGHUP'))

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
        childProcess.once('exit', (code: number = 0) => process.exit(code))
    }

    return childProcess
}
