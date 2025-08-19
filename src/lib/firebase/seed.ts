
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
