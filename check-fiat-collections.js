const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/paycoinz').then(async () => {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    // Find collections related to fiat/withdraw
    const fiatCollections = collections.filter(c =>
        c.name.toLowerCase().includes('fiat') || c.name.toLowerCase().includes('withdraw')
    );

    console.log('All collections:', collections.map(c => c.name));
    console.log('\n--- Fiat/Withdraw related collections ---');

    for (const col of fiatCollections) {
        const count = await db.collection(col.name).countDocuments();
        const sample = await db.collection(col.name).findOne({}, { sort: { createdAt: -1 } });
        console.log(`\nCollection: ${col.name} (${count} documents)`);
        if (sample) console.log('Sample:', JSON.stringify(sample, null, 2));
    }

    mongoose.disconnect();
}).catch(e => console.error(e));
