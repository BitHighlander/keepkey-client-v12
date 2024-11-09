import type { PlasmoMessaging } from "@plasmohq/messaging"

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
    let output  = input * HIDDEN_NUMBER
    res.send(output)
}

export default handler
