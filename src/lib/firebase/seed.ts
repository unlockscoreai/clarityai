
import * as admin from 'firebase-admin';
import { serviceAccount } from './service-account';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();

const creditBoosters = [
    {
        name: "Self Credit Builder",
        description: "Build payment history with a credit-builder loan and secured Visa card. No hard credit pull.",
        url: "https://www.self.inc/",
        type: "Credit Builder Loan",
        price: "Starts at $25/mo",
        limit: "Varies",
        reportsTo: ["Equifax", "Experian", "TransUnion"],
        potentialBoost: "Build payment history",
        recommendedFor: "thin credit files or poor credit."
    },
    {
        name: "Kikoff Credit Account",
        description: "A $750 revolving line of credit with no interest, no fees, and no credit check. Helps with utilization and history.",
        url: "https://kikoff.com/",
        type: "Revolving Credit Line",
        price: "$5/mo",
        limit: "$750",
        reportsTo: ["Equifax", "Experian"],
        potentialBoost: "Lower utilization",
        recommendedFor: "high credit utilization."
    },
    {
        name: "Experian Boost",
        description: "Get credit for the bills you already pay, like your phone, utilities, and streaming services.",
        url: "https://www.experian.com/consumer-products/experian-boost.html",
        type: "Rent & Bill Reporting",
        price: "Free",
        limit: "N/A",
        reportsTo: ["Experian"],
        potentialBoost: "Add on-time payments",
        recommendedFor: "adding positive payment history."
    },
];

const affiliateStats = [
    {
        id: 'affiliate1',
        name: 'Top Tier Affiliates',
        totalRevenue: 5250,
        clients: 25,
        referrals: 10,
    },
    {
        id: 'affiliate2',
        name: 'Credit Gurus Inc.',
        totalRevenue: 4800,
        clients: 22,
        referrals: 8,
    },
    {
        id: 'affiliate3',
        name: 'Financial Freedom Co.',
        totalRevenue: 3500,
        clients: 18,
        referrals: 5,
    }
];

const demoClients = [
    { name: "Alice Johnson", email: "alice@example.com", address: "123 Maple St", status: "pending_analysis", earnings: 0 },
    { name: "Bob Williams", email: "bob@example.com", address: "456 Oak Ave", status: "complete", earnings: 150 },
    { name: "Charlie Brown", email: "charlie@example.com", address: "789 Pine Ln", status: "letters_delivered", earnings: 75 },
]

async function seedDatabase() {
    console.log('Starting to seed the database...');
    const batch = db.batch();

    // Seed creditBoosters
    const boostersCol = db.collection('creditBoosters');
    creditBoosters.forEach((booster) => {
        const docRef = boostersCol.doc(); // Automatically generate ID
        batch.set(docRef, booster);
    });
    console.log(`${creditBoosters.length} credit boosters prepared for seeding.`);
    
    // Seed affiliateStats
    const statsCol = db.collection('affiliateStats');
    affiliateStats.forEach((stat) => {
        const docRef = statsCol.doc(stat.id); // Use specific ID
        const { id, ...statData } = stat;
        batch.set(docRef, statData);
    });
    console.log(`${affiliateStats.length} affiliate stats prepared for seeding.`);
    
    // Seed Demo User Data
    try {
        const demoUserRecord = await admin.auth().getUserByEmail("demo@example.com");
        const demoUid = demoUserRecord.uid;
        
        // 1. Create user doc
        const userDocRef = db.collection('users').doc(demoUid);
        batch.set(userDocRef, {
            uid: demoUid,
            name: "Demo User",
            email: "demo@example.com",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            credits: 5,
            subscription: { plan: 'pro', status: 'active' },
            roles: ['affiliate']
        });

        // 2. Create affiliate doc
        const affiliateDocRef = db.collection('affiliates').doc(demoUid);
        batch.set(affiliateDocRef, {
            name: "Demo User Inc.",
            userId: demoUid,
            status: "Active",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // 3. Create mock clients for the demo affiliate
        const clientsColRef = db.collection('affiliates').doc(demoUid).collection('clients');
        demoClients.forEach(client => {
            const clientDocRef = clientsColRef.doc();
            batch.set(clientDocRef, {
                ...client,
                affiliateId: demoUid,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        console.log(`Prepared demo data for user ${demoUid}`);

    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            console.warn("Demo user 'demo@example.com' not found in Firebase Auth. Skipping demo data seeding.");
            console.warn("Please create the demo user in the Firebase console to seed their data.");
        } else {
            console.error("Error preparing demo user data:", error);
        }
    }


    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase().then(() => {
    // Manually exit the process, otherwise it will hang
    process.exit(0);
}).catch(() => {
    process.exit(1);
});
