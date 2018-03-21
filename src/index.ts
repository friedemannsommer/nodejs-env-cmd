import { readFile } from 'fs'
import { parse as parseEnvFile } from 'dotenv'
import { resolve as resolvePath } from 'path'
import * as spawn from 'cross-spawn'
import { ChildProcess } from 'child_process'

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

async function loadEnvFile(path: string): Promise<string> {
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

function spawnChildProcess(cmd: string, args: string[], stdio: IOptions['stdio'], processEnv: object): ChildProcess {
    const childProcess = spawn(cmd, args, {
        cwd: process.cwd(),
        env: processEnv,
        stdio
    }) as IChildProcess

    childProcess.hasExited = false

    const killProcess = killChildProcess(childProcess)

    process.once('beforeExit', killProcess())
    process.once('uncaughtException', killProcess())
    process.once('unhandledRejection', killProcess())
    process.once('SIGTERM', killProcess())
    process.once('SIGINT', killProcess('SIGINT'))
    process.once('SIGBREAK', killProcess('SIGBREAK'))
    process.once('SIGHUP', killProcess('SIGHUP'))
    childProcess.once('exit', () => {
        childProcess.hasExited = true
    })

    return childProcess
}

export default async function envCommand(
    cmd: string,
    args: string[],
    options?: IOptions
): Promise<ChildProcess> {
    const envFilePath = (options && options.envFilePath) || '.env'
    const closeAfterFinish = (options && typeof options.closeAfterFinish === 'boolean')
        ? options.closeAfterFinish
        : false
    const childStdio = (options && options.stdio) || 'inherit'

    const childProcess = spawnChildProcess(
        cmd, args, childStdio,
        parseEnvFile(
            await loadEnvFile(resolvePath(process.cwd(), envFilePath))
        )
    )

    if (closeAfterFinish) {
        childProcess.once('exit', (code: number = 0) => process.exit(code))
    }

    return childProcess
}
