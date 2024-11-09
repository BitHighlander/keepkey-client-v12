import type { PlasmoMessaging } from "@plasmohq/messaging"
import { KEEPKEY_STATE } from '../state'; // Adjust the import path if necessary

const HIDDEN_NUMBER = 541

export type RequestBody = {
    input: number
}

export type RequestResponse = number

const handler: PlasmoMessaging.MessageHandler<
    RequestBody,
    RequestResponse
    > = async (req, res) => {
    const { input } = req.body

    console.log('input: ',input)
    // let output  = input * HIDDEN_NUMBER
    //@ts-ignore
    res.send({ state: KEEPKEY_STATE });
}

export default handler
