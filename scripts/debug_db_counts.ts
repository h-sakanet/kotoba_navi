
import { db } from '../src/db';
import { SCOPES } from '../src/data/scope';

async function check() {
    // Target Antonyms pages 96-97 (Scope 42A-27)
    const scope = SCOPES.find(s => s.id === '42A-27');
    if (!scope) {
        console.log('Scope 42A-27 not found');
        return;
    }
    console.log(`Checking Scope: ${scope.category} (P.${scope.startPage}-${scope.endPage})`);

    const words = await db.words
        .where('page')
        .between(scope.startPage, scope.endPage, true, true)
        .toArray();

    console.log(`Total DB entries found: ${words.length}`);

    let learnedCount = 0;
    words.forEach((w, i) => {
        if (w.isLearnedCategory) learnedCount++;
        console.log(`[${i}] ID: ${w.id} | Page: ${w.page} | No: ${w.numberInPage} | Group?: ${w.groupMembers?.length} | Learned: ${w.isLearnedCategory}`);
    });

    console.log(`Learned Count: ${learnedCount}`);
    console.log(`Completion Rate: ${(learnedCount / words.length) * 100}%`);
}

check().catch(console.error).finally(() => process.exit());
