# Math Textbook Transcription Tool

A comprehensive web-based application for transcribing and digitizing math textbook content with advanced features for structured data entry, image extraction, and educational content management. This tool enables educators and content creators to convert physical or PDF-based math textbooks into structured JSON format with support for mathematical notation, images, questions, and educational standards.

## Features

### Core Functionality

- **PDF Viewer & Navigation**: Upload and view textbook and guidebook PDFs with zoom controls, page navigation, and persistent view state
- **Bounding Box Drawing**: Interactive tool for drawing and managing bounding boxes on PDF pages to extract images and visual elements
- **Form-Based Transcription**: Structured input form with tabbed interface (Basic Info, Lesson Preamble, Content, Questions)
- **JSON Import/Export**: Import JSON or Python dictionary format to populate forms, export structured JSON output
- **Auto-Save**: Automatic saving of progress to browser localStorage with visual save indicators
- **Data Persistence**: PDFs stored in IndexedDB for offline access and faster loading

### Content Management

- **Multiple Question Types**: Support for free form, multiple choice, checkbox, fill-in-the-blanks, matching, annotation, and table creation questions
- **Content Sections**: Organize instructional content with support for multiple sections per lesson
- **Image Management**: Associate images with content sections, questions, and answers using bounding box coordinates
- **Table Support**: Insert and manage tables with markdown syntax
- **Reordering Tools**: Move sections, questions, images, and choices up/down with intuitive controls
- **Copy/Paste/Duplicate**: Copy entire sections or questions, paste to replace or add new items, one-click duplication

### Text Formatting & Preview

- **Markdown Support**: Full markdown formatting with live preview
- **Mathematical Notation**: LaTeX support with KaTeX rendering for inline (`$...$`) and block (`$$...$$`) math expressions
- **Live Preview**: Real-time rendering of markdown and LaTeX as you type
- **Markdown Toolbar**: Quick formatting buttons for bold, italic, lists, and LaTeX insertion
- **RTL/LTR Support**: Bidirectional text support for Arabic and other RTL languages with automatic direction detection
- **Auto-Resize Textareas**: Optional automatic textarea expansion as content grows

### User Interface

- **Dark Mode**: Complete dark theme with smooth transitions
- **Search & Filter**: Search across all content sections and questions with highlighting
- **Quick Jump Menu**: Navigate quickly to any form section, content section, or question
- **Tabbed Interface**: Organized tabs for Basic Info, Lesson Preamble, Content, and Questions
- **Responsive Design**: Works on desktop and tablet devices
- **Tooltips**: Helpful tooltips on all buttons and form fields

### Validation & Quality Control

- **Comprehensive Validation**: Validates required fields, image references, question IDs, and data consistency
- **Image Reference Validation**: Ensures all referenced images exist and are properly numbered
- **Duplicate Detection**: Warns about duplicate question IDs
- **HTML Tag Validation**: Prevents use of unsupported HTML tags (e.g., `<br>`)
- **Coordinate Normalization**: Automatic normalization of bounding box coordinates
- **Error Messages**: User-friendly error messages with specific guidance on how to fix issues

### Advanced Features

- **What's New Modal**: Stay informed about latest updates and improvements
- **Undo/Redo**: Undo and redo for markdown formatting operations
- **Keyboard Shortcuts**: Save progress with Ctrl+S
- **Scroll to Top**: Quick navigation button
- **PDF State Persistence**: PDF viewer maintains page, zoom, and document selection across sessions

## Usage

Simply open `index.html` in a web browser. No server required - everything runs client-side.

## Hosting

This tool can be hosted on GitHub Pages.

**Live Demo**: [View on GitHub Pages](https://ali-duku.github.io/Transcription_Tool/)

## Browser Requirements

- Modern browser with JavaScript enabled
- Support for IndexedDB (for PDF storage)
- Support for Canvas API (for PDF rendering)

## License

MIT License

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
