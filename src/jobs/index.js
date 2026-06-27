// ── Worker bootstrap ──
// এই ফাইল import করলেই ranking + roll worker চালু হয়ে queue listen করা শুরু করে।
// server.js এটা import করে (একই process), অথবা চাইলে আলাদা worker process-এ
// `node src/jobs/index.js` দিয়েও চালানো যায় (production-এ API থেকে আলাদা scale করতে)।
import { rankingWorker } from './ranking.job.js';
import { rollWorker } from './roll.job.js';

console.log('[workers] ranking + roll workers started');

export { rankingWorker, rollWorker };
