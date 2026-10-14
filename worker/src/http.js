export class HttpError extends Error {
 constructor(status, message = 'request_failed') { super(message); this.status = status; }
}
export function json(data, status = 200, extraHeaders = {}) {
 const headers = new Headers(extraHeaders);
 headers.set('Content-Type', 'application/json');
 headers.set('Cache-Control', 'no-store');
 headers.delete('Access-Control-Allow-Origin');
 return new Response(JSON.stringify(data), {status, headers});
}
export async function readJson(request) {
 if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415);
 try {
  const data = await request.json();
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
  return data;
 } catch { throw new HttpError(400); }
}
