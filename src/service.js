// The AI Board Direction app's service for the other Triodian apps (development plan task 3.4).
// The AI Risk Appetite app binds to this entrypoint with a Cloudflare service binding:
//   "services": [{ "binding": "BOARD", "service": "board-direction", "entrypoint": "BoardService" }]
// A binding reaches the Worker directly inside the Cloudflare account. It has no public URL and needs no secret.
// It offers one thing only: the board directions as the chair recorded them.
import { WorkerEntrypoint } from 'cloudflare:workers';
import { directionsForService } from './worker.js';

export class BoardService extends WorkerEntrypoint {
  /** The recorded board directions: { status, body }, as GET /api/board-directions answers it. */
  async directions() { return directionsForService(this.env); }
}
