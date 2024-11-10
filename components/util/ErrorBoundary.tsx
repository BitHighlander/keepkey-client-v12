import React, { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state to show fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error and error info for further investigation
        this.setState({ error, errorInfo });
        console.error("Error caught in Error Boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Render fallback UI with detailed error information
            return (
                <div style={{ padding: "20px", textAlign: "center", color: "#333" }}>
                    <h2>Something went wrong.</h2>
                    <p>We're working on fixing it. Please try again later.</p>
                    {this.state.error && (
                        <details style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>
                            <summary>Error Details</summary>
                            <p><strong>{this.state.error.toString()}</strong></p>
                            {this.state.errorInfo && (
                                <pre>{this.state.errorInfo.componentStack}</pre>
                            )}
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
