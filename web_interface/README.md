# Material Science Information Extractor

Material Science Information Extractor is a tool designed to extract and highlight information from PDF documents related to material science. This project leverages React components and various libraries to provide a user-friendly interface for annotating and highlighting PDF content.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
- [Development](#development)
- [License](#license)

## Installation

To install the dependencies, run:

```bash
npm install
```

## Usage

To start the development server, run:

```bash
npm run dev
```


This will start the Vite development server and you can access the application at `http://localhost:3000`.

## Features

- **PDF Highlighting**: Highlight and annotate PDF documents.
- **Drag and Drop**: Easily upload PDF files using drag and drop functionality.
- **React Components**: Built with reusable React components.
- **Material UI**: Styled using Material UI for a consistent look and feel.

## Scripts

- `start`: Alias for `npm run dev`.
- `dev`: Starts the Vite development server.
- `build`: Cleans the `dist` and `public` directories and builds the project.
- `build:esm`: Compiles the project to ES modules.
- `build:cjs`: Compiles the project to CommonJS modules.
- `build:copy-styles`: Copies styles to the `dist` directory.
- `build:matsci`: Builds the `matsci` project and copies the output to the `public` directory.
- `build:docs`: Generates documentation using Typedoc.
- `format`: Formats the code using Prettier.
- `format:check`: Checks the code formatting using Prettier.
- `clean`: Removes the `dist` and `public` directories.

## Dependencies

- `react`: ^18.2.0
- `react-dom`: ^18.2.0
- `@emotion/react`: ^11.11.4
- `@emotion/styled`: ^11.11.5
- `@mui/icons-material`: ^5.16.1
- `@mui/material`: ^5.16.1
- `axios`: ^1.7.2
- `lodash.debounce`: ^4.0.8
- `mui-datatables`: ^4.3.0
- `pdfjs-dist`: 2.16.105
- `react-drag-drop-files`: ^2.3.10
- `react-draggable`: ^4.4.6
- `react-dropzone`: ^14.2.3
- `react-loading-overlay-ts`: ^2.0.2
- `react-rnd`: ^10.4.1
- `react-router-dom`: ^6.24.0

## Development

To contribute to the project, clone the repository and install the dependencies:

```bash
git clone https://github.com/truongdo619/material-science-information-extractor.git
cd material-science-information-extractor
npm install
```


You can then start the development server using:

```bash
npm run dev
```

This will start the Vite development server, and you can access the application at `http://localhost:5173`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Author

- Do Dinh Truong <truongdo619@gmail.com>

## Contributors

- Do Dinh Truong <truongdo619@gmail.com>