import { Provider } from "./components/ui/provider"
import App from "./components/app"


function Sidebar() {
    return (
        <Provider>
            <App />
        </Provider>
    )
}

export default Sidebar
