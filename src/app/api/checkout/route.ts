
'use server';

import {NextResponse} from 'next/server';
import {auth} from '@/lib/firebase/server';
import {stripe} from '@/lib/stripe';
import {headers} from 'next/headers';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { coupons } from '@/lib/coupons';

export async function POST(req: Request) {
  const { plan, credits, coupon, user: authedUser, affiliateId, clientId } = await req.json();
  const headersList = headers();
  // handle request
}
