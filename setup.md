# Setup Guide

## Prerequisites

- Node.js (v18 or higher recommended)
- A Google Cloud Project with the Gemini API enabled
- An API Key from Google AI Studio

## Installation

1.  **Install Dependencies**
    Open your terminal in the project root and run:
    ```bash
    npm install
    ```

2.  **Environment Configuration**
    Create a `.env` file in the root directory. Add your Gemini API key:
    ```bash
    API_KEY=your_actual_api_key_here
    ```

## Running the Application

1.  **Start Development Server**
    ```bash
    npm start
    ```
    This will launch the application, usually at `http://localhost:1234` (depending on your bundler, e.g., Parcel).

2.  **Build for Production**
    ```bash
    npm run build
    ```
    The output files will be generated in the `dist/` directory.

## Troubleshooting

- **API Errors**: Ensure your API Key is valid and has access to `gemini-2.5-flash` and `gemini-3-pro-preview` models.
- **Styling**: If styles look broken, ensure Tailwind CSS is loading correctly via the CDN link in `index.html`.
