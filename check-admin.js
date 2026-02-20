const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/paycoinz').then(async () => {
    const db = mongoose.connection.db;

    // Find the admin user
    const admin = await db.collection('admins').findOne({ _id: new mongoose.Types.ObjectId('693c0338fae2bdf92e9378b2') });
    console.log('Admin document:');
    console.log(JSON.stringify(admin, null, 2));

    // Also check all admins
    const allAdmins = await db.collection('admins').find({}).toArray();
    console.log('\nAll admins:');
    allAdmins.forEach(a => {
        console.log(`- ${a.email} | role: ${a.role} | permissions: ${JSON.stringify(a.permissions)}`);
    });

    mongoose.disconnect();
}).catch(e => console.error(e));
