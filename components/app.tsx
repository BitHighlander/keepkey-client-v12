import { useState } from "react"
import { Box, Heading, Input, Link } from "@chakra-ui/react"

function App() {
    const [data, setData] = useState("")

    return (
        <Box display="flex" flexDirection="column" p={4}>
            <Heading as="h2" size="md" mb={4}>
                Welcome to your{" "}
                <Link href="https://www.plasmo.com" isExternal>
                    Plasmo
                </Link>{" "}
                Extension!
            </Heading>
            <Input
                placeholder="Type something..."
                onChange={(e) => setData(e.target.value)}
                value={data}
                mb={4}
            />
            <Link href="https://docs.plasmo.com" isExternal>
                View Docs
            </Link>
        </Box>
    )
}

export default App
