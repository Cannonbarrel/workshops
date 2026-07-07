'use strict';

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const TABLE = process.env.DYNAMODB_TABLE;

// ── Structured logging ────────────────────────────────────────
function log(level, message, extra = {}) {
  console.log(JSON.stringify({ level, message, timestamp: new Date().toISOString(), service: 'stash-api', ...extra }));
}

// ── HTTP response helper ─────────────────────────────────────
function respond(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

// ── URL validation ────────────────────────────────────────────
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// ── Main handler ──────────────────────────────────────────────
exports.handler = async (event) => {
  const start = Date.now();
  const method = event.httpMethod;
  const path = event.path;
  const pathParams = event.pathParameters || {};

  log('info', 'Request', { method, path });

  if (method === 'OPTIONS') {
    return respond(200, {});
  }

  try {
    // GET /bookmarks
    if (method === 'GET' && path === '/bookmarks') {
      const result = await ddb.send(new ScanCommand({ TableName: TABLE }));
      const items = (result.Items || []).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      log('info', 'Bookmarks fetched', { count: items.length, durationMs: Date.now() - start });
      return respond(200, { bookmarks: items });
    }

    // POST /bookmarks
    if (method === 'POST' && path === '/bookmarks') {
      let body;
      try {
        body = JSON.parse(event.body || '{}');
      } catch {
        return respond(400, { error: 'Invalid JSON body' });
      }

      const { title, url } = body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return respond(400, { error: 'Title is required' });
      }
      if (title.trim().length > 200) {
        return respond(400, { error: 'Title must be 200 characters or less' });
      }
      if (!url || typeof url !== 'string' || !url.trim()) {
        return respond(400, { error: 'URL is required' });
      }
      if (!isValidUrl(url.trim())) {
        return respond(400, { error: 'URL must start with http:// or https://' });
      }

      const item = {
        id: uuidv4(),
        title: title.trim(),
        url: url.trim(),
        createdAt: new Date().toISOString(),
      };

      await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
      log('info', 'Bookmark created', { id: item.id, durationMs: Date.now() - start });
      return respond(201, { bookmark: item });
    }

    // DELETE /bookmarks/{id}
    if (method === 'DELETE' && pathParams.id) {
      await ddb.send(new DeleteCommand({
        TableName: TABLE,
        Key: { id: pathParams.id },
      }));
      log('info', 'Bookmark deleted', { id: pathParams.id, durationMs: Date.now() - start });
      return respond(200, { message: 'Bookmark deleted' });
    }

    log('warn', 'Route not found', { method, path });
    return respond(404, { error: 'Not found' });

  } catch (err) {
    log('error', 'Unhandled error', { error: err.message, stack: err.stack, durationMs: Date.now() - start });
    return respond(500, { error: 'Internal server error' });
  }
};
