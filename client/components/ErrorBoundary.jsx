import React from "react";





class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError, error, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught an error, error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        
          🚨 Application Error
          Something went wrong
          
            Error Details
            
              {this.state.error && this.state.error.toString()}
              
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            
          
           window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#900",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Reload Page
          
        
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
