import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import StoreProfile from '@/models/StoreProfile';
import { getCurrentStoreProfile } from '@/lib/auth-store';

export async function PATCH(request) {
  const { session, profile } = await getCurrentStoreProfile();
  if (!profile || !session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();
  const body = await request.json();
  const doc = await StoreProfile.findOne({ ownerId: session.user.id });

  if (!doc) {
    return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
  }

  doc.storeName = body.storeName ?? doc.storeName;
  doc.storeLogo = body.storeLogo ?? doc.storeLogo;
  doc.storeBanner = body.storeBanner ?? doc.storeBanner;
  doc.bio = body.bio ?? doc.bio;
  doc.instagramHandle = body.instagramHandle ?? doc.instagramHandle;
  doc.facebookHandle = body.facebookHandle ?? doc.facebookHandle;
  doc.whatsappNumber = body.whatsappNumber ?? doc.whatsappNumber;
  doc.messengerUrl = body.messengerUrl ?? doc.messengerUrl;
  doc.profilePicture = body.profilePicture ?? doc.profilePicture;
  doc.currencyCode = body.currencyCode ?? doc.currencyCode;
  doc.deliveryInsideDhaka = body.deliveryInsideDhaka ?? doc.deliveryInsideDhaka;
  doc.deliveryOutsideDhaka = body.deliveryOutsideDhaka ?? doc.deliveryOutsideDhaka;
  doc.freeDeliveryThreshold = body.freeDeliveryThreshold ?? doc.freeDeliveryThreshold;
  doc.defaultDeliveryEstimate = body.defaultDeliveryEstimate ?? doc.defaultDeliveryEstimate;
  doc.exchangePolicy = body.exchangePolicy ?? doc.exchangePolicy;
  doc.orderConfirmationTemplate = body.orderConfirmationTemplate ?? doc.orderConfirmationTemplate;
  doc.deliveryUpdateTemplate = body.deliveryUpdateTemplate ?? doc.deliveryUpdateTemplate;
  doc.outForDeliveryTemplate = body.outForDeliveryTemplate ?? doc.outForDeliveryTemplate;
  doc.paymentMethods = ['Cash on delivery'];

  await doc.save();

  return NextResponse.json(doc);
}
