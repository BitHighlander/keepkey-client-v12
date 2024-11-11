// theme.ts
import { defineConfig, createSystem, defaultSystem } from "@chakra-ui/react"

// Define only the additional configuration you need to add
const additionalConfig = defineConfig({
    tokens: {
        colors: {
            primary: {
                50: "#e5fcf1",
                100: "#27ef96",
                200: "#10d876",
                300: "#0eb862",
                400: "#0cae55",
                500: "#0b8e48",
                600: "#09773d",
                700: "#075f32",
                800: "#054826",
                900: "#03311a",
            },
            // Add other specific tokens as needed
        },
    },
})

// Merge the entire `defaultSystem` with your additional configuration
const system = createSystem({
    ...defaultSystem
})

export default system
