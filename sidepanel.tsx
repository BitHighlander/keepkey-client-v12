import React from 'react';
import { Provider } from './components/ui/provider';
import App from './components/app';
import ErrorBoundary from './components/util/ErrorBoundary';

function Sidebar() {
    return (
        <Provider>
            <ErrorBoundary>
                <App />
            </ErrorBoundary>
        </Provider>
    );
}

export default Sidebar;
