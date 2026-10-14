const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
const progressPath = path.join(root, 'progress.json');
const maxProgressBytes = 2 * 1024 * 1024;
let progressWriteQueue = Promise.resolve();

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const allowedFiles = new Set([
  'index.html',
  'styles.css',
  'app.js',
  'search-course.js',
  'recommendation-course.js',
  'production-course.js',
  'favicon.svg',
  'ML_INTERVIEW_QNA.md'
]);

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end(JSON.stringify(payload));
}

function readProgress(response) {
  fs.readFile(progressPath, 'utf8', (error, data) => {
    if (error?.code === 'ENOENT') {
      sendJson(response, 200, null);
      return;
    }
    if (error) {
      sendJson(response, 500, { error: 'Unable to read progress' });
      return;
    }
    try {
      sendJson(response, 200, JSON.parse(data));
    } catch {
      sendJson(response, 500, { error: 'Saved progress is invalid' });
    }
  });
}

function writeProgress(request, response) {
  let body = '';
  let receivedBytes = 0;
  let stopped = false;

  request.setEncoding('utf8');
  request.on('data', (chunk) => {
    if (stopped) return;
    receivedBytes += Buffer.byteLength(chunk);
    if (receivedBytes > maxProgressBytes) {
      stopped = true;
      sendJson(response, 413, { error: 'Progress data is too large' });
      request.destroy();
      return;
    }
    body += chunk;
  });

  request.on('end', () => {
    if (stopped) return;
    let progress;
    try {
      progress = JSON.parse(body);
    } catch {
      sendJson(response, 400, { error: 'Progress must be valid JSON' });
      return;
    }

    if (!progress || progress.version !== 1 || typeof progress.xp !== 'number' || typeof progress.reviews !== 'object') {
      sendJson(response, 400, { error: 'Progress data has an invalid format' });
      return;
    }

    const serialized = `${JSON.stringify(progress, null, 2)}\n`;
    progressWriteQueue = progressWriteQueue
      .catch(() => undefined)
      .then(() => fs.promises.writeFile(progressPath, serialized, 'utf8'));

    progressWriteQueue
      .then(() => sendJson(response, 200, { saved: true, savedAt: new Date().toISOString() }))
      .catch(() => sendJson(response, 500, { error: 'Unable to save progress' }));
  });
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === '/api/progress') {
    if (request.method === 'GET') {
      readProgress(response);
      return;
    }
    if (request.method === 'PUT') {
      writeProgress(request, response);
      return;
    }
    sendJson(response, 405, { error: 'Method not allowed' });
    return;
  }

  const requested = requestUrl.pathname === '/'
    ? 'index.html'
    : decodeURIComponent(requestUrl.pathname.slice(1));

  if (!allowedFiles.has(requested)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  const filePath = path.join(root, requested);
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(error.code === 'ENOENT' ? 404 : 500, {
        'Content-Type': 'text/plain; charset=utf-8'
      });
      response.end(error.code === 'ENOENT' ? 'Not found' : 'Unable to read file');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`ML Study Lab is running at http://localhost:${port}`);
  console.log(`Listening on ${host}:${port}`);
});

server.on('error', (error) => {
  console.error(`Unable to start the server: ${error.message}`);
  process.exitCode = 1;
});
