# routewatch

Lightweight Express.js middleware that logs and visualizes API route usage in real time.

## Installation

```bash
npm install routewatch
```

## Usage

```javascript
const express = require('express');
const routewatch = require('routewatch');

const app = express();

// Add routewatch middleware
app.use(routewatch());

app.get('/api/users', (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

Once running, routewatch automatically logs incoming requests to the console and exposes a real-time dashboard at `http://localhost:3000/_routewatch` showing route hit counts, response times, and status codes.

### Options

```javascript
app.use(routewatch({
  dashboard: true,       // Enable the visual dashboard (default: true)
  logToConsole: true,    // Log requests to stdout (default: true)
  path: '/_routewatch'  // Dashboard route path (default: '/_routewatch')
}));
```

## Features

- 📊 Real-time route usage dashboard
- 🕒 Response time tracking
- 📋 HTTP status code monitoring
- ⚡ Zero dependencies, minimal overhead
- 🔧 Simple drop-in middleware setup

## License

[MIT](LICENSE)