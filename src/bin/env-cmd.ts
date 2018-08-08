#!/usr/bin/env node
import * as minimist from 'minimist'
import envCommand from '../index'

function parseArgs(args: string[]): void {
    const options = minimist(args, {
        default: {
            timeout: 0,
            envFile: '.env',
            preferParentEnv: false
        },
        string: ['envFile', 'timeout'],
        boolean: ['preferParentEnv'],
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
        preferParentEnv: options.preferParentEnv,
        timeout
    }).catch((err: Error) => {
        console.error(err)
        process.exit(1)
    })
}

parseArgs(process.argv.slice(2))
