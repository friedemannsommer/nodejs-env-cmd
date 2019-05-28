import test from 'ava'
import { resolve } from 'path'
import runCmd from '../index'
import { Readable } from 'stream'
import { ChildProcess } from 'child_process'

const envFilePath = resolve(__dirname, '../../.test.env')

test.cb('spawn and echo "NODE_ENV"', (ex) => {
    runCmd('echo "$NODE_ENV"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.true(chunk.toString('utf8').startsWith('test'))
            ex.end()
        })
    })
})

test.cb('spawn and echo "EXAMPLE_STRING"', (ex) => {
    runCmd('echo "$EXAMPLE_STRING"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.true(chunk.toString('utf8').startsWith('str'))
            ex.end()
        })
    })
})

test.cb('spawn and echo "EXAMPLE_BOOL"', (ex) => {
    runCmd('echo "$EXAMPLE_BOOL"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.true(chunk.toString('utf8').startsWith('true'))
            ex.end()
        })
    })
})

test.cb('spawn and echo "EXAMPLE_INT"', (ex) => {
    runCmd('echo "$EXAMPLE_INT"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.true(chunk.toString('utf8').startsWith('0'))
            ex.end()
        })
    })
})

test.cb('spawn and test "EXAMPLE_COMMENT"', (ex) => {
    runCmd('echo "$EXAMPLE_COMMENT"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.false(chunk.toString('utf8').startsWith('this should not have happend'))
            ex.end()
        })
    })
})

test.cb('spawn and inherit parent env, prefer child env', (ex) => {
    runCmd('echo "$HOME"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: true,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.true(chunk.toString('utf8').startsWith('testing override'))
            ex.end()
        })
    })
})

test.cb('spawn and inherit parent env, prefer parent env', (ex) => {
    runCmd('echo "$HOME"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: true,
        preferParentEnv: true,
        pipeOutput: false,
        timeout: 0
    }).then((proc: ChildProcess) => {
        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            ex.false(chunk.toString('utf8').startsWith('testing override'))
            ex.end()
        })
    })
})

test.cb('spawn and wait until timeout', (ex) => {
    runCmd('sleep 1s && echo "done"', {
        closeAfterFinish: false,
        envFilePath,
        inheritParentEnv: false,
        preferParentEnv: false,
        pipeOutput: false,
        timeout: 250
    }).then((proc: ChildProcess) => {
        const output: Buffer[] = [];

        (proc.stdout as Readable).on('data', (chunk: Buffer) => {
            output.push(chunk)
        })

        proc.once('exit', () => {
            ex.is(output.length, 0)
            ex.end()
        })
    })
})
