import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service here
        console.error("Error caught in Error Boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{ padding: "20px", textAlign: "center" }}>
                    <h2>Something went wrong.</h2>
                    <p>We're working on fixing it. Please try again later.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
