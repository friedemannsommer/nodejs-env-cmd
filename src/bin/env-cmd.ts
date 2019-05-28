#!/usr/bin/env node
import * as minimist from 'minimist'
import envCommand from '../index'

function parseArgs(args: string[]): void {
    const options = minimist(args, {
        alias: {
            envFile: ['env-file', 'e'],
            timeout: ['t'],
            preferParentEnv: ['prefer-parent-env', 'ppe'],
            inheritParentEnv: ['inherit-parent-env', 'ipe']
        },
        default: {
            timeout: 0,
            envFile: '.env',
            preferParentEnv: false,
            inheritParentEnv: true
        },
        string: ['envFile', 'timeout'],
        boolean: ['preferParentEnv', 'inheritParentEnv'],
        stopEarly: true
    })

    let timeout = options.timeout

    if (typeof timeout === 'string') {
        timeout = parseInt(timeout, 10)
    }

    if (isNaN(timeout) || !isFinite(timeout)) {
        timeout = 0
    }

    envCommand(options._.join(' '), {
        closeAfterFinish: true,
        envFilePath: options.envFile,
        preferParentEnv: (typeof options.preferParentEnv !== 'boolean') ? options.preferParentEnv === 'true' : options.preferParentEnv,
        inheritParentEnv: (typeof options.inheritParentEnv !== 'boolean') ? options.inheritParentEnv === 'true' : options.inheritParentEnv,
        timeout,
        pipeOutput: true
    }).catch((err: Error) => {
        console.error(err)
        process.exit(1)
    })
}

parseArgs(process.argv.slice(2))
