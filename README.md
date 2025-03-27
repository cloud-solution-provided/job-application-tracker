# Job Application Tracker

A minimalist dashboard for managing job applications, built with Node.js, Express, and EJS.

## Features

- Clean, minimalist interface with a modern color scheme
- Upload and manage resumes with drag-and-drop support
- Track application status (Applied, Selected, Not Selected)
- View job descriptions and match percentages
- Analytics dashboard with charts and statistics
- Responsive design for desktop and mobile
- Secure file upload handling
- Real-time status updates

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd job-application-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create the uploads directory:
```bash
mkdir -p public/uploads
```

4. Start the application:
```bash
node app.js
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
job-application-tracker/
├── app.js                 # Main application file
├── package.json          # Project dependencies
├── public/              # Static files
│   ├── css/
│   │   └── style.css    # Custom styles
│   ├── js/
│   │   └── main.js      # Client-side JavaScript
│   └── uploads/         # Resume upload directory
└── views/              # EJS templates
    ├── partials/       # Reusable template parts
    │   ├── header.ejs
    │   └── footer.ejs
    ├── index.ejs       # Dashboard view
    └── analytics.ejs   # Analytics view
```

## Color Palette

- Dark Green: #0d2a2b
- Moonstone: #5eb1bf
- Light Gray (Sky): #c1def6
- Orange (Tangelo): #fe7b45
- Chili Red: #d84727

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 