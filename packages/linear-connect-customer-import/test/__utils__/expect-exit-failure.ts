import {Cause, Exit} from "effect";


export function expectExitFailure<A, E>(exit: Exit.Exit<A, E>) {
    if (Exit.isSuccess(exit)) {
        throw new Error(`Expected exit to fail, received success instead`)
    }
    if (!Cause.isFailType(exit.cause)) {
        throw new Error(`Expected to fail with a known error, received cause instead: ${exit.cause}`)
    }
    return exit.cause.error
}

export function expectExitSuccess<A, E>(exit: Exit.Exit<A, E>) {
    if (Exit.isFailure(exit)) {
        throw new Error(`Expected exit to succeed, received failure instead: ${exit.cause}`)
    }
    return exit
}