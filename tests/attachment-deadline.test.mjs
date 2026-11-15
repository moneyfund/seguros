import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withDeadline} from '../src/attachmentDeadline.ts';
test('returns completed read',async()=>assert.equal(await withDeadline(Promise.resolve('ok'),100,'timeout'),'ok'));
test('reports storage errors',async()=>await assert.rejects(withDeadline(Promise.reject(new Error('denied')),100,'timeout'),/denied/));
test('does not hang on stalled read',async()=>await assert.rejects(withDeadline(new Promise(()=>{}),15,'timeout'),/timeout/));
test('late success does not replace timeout',async()=>{let finish;const p=new Promise(r=>finish=r);await assert.rejects(withDeadline(p,10,'timeout'),/timeout/);finish('late');});
