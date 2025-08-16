
import { db } from "@/lib/firebase/client";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export type AffiliateStat = {
    id: string;
    totalRevenue: number;
    name?: string;
    [key: string]: any;
}

/**
 * Fetches top affiliates from the 'affiliateStats' collection based on total revenue.
 * @param limitCount The number of affiliates to fetch.
 * @returns A promise that resolves to an array of top affiliates.
 */
export async function fetchLeaderboard(limitCount = 10): Promise<AffiliateStat[]> {
  const q = query(
    collection(db, "affiliateStats"),
    orderBy("totalRevenue", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AffiliateStat));
}
