import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface UserSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  currency: string;
  timezone: string;
  theme: string;
}

interface NotificationSettings {
  budgetExceeded: boolean;
  largeTransaction: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  accountConnection: boolean;
}

interface SettingsData {
  profile?: {
    name: string;
    timezone: string;
  };
  notifications?: NotificationSettings;
  general?: UserSettings;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        preferences: true,
        monthlyBudget: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse preferences from JSON or return defaults
    const preferences = user.preferences as any || {};

    return NextResponse.json({
      profile: {
        name: user.name || '',
        email: user.email,
        timezone: preferences.timezone || 'America/New_York',
      },
      notifications: {
        budgetExceeded: preferences.notifications?.budgetExceeded ?? true,
        largeTransaction: preferences.notifications?.largeTransaction ?? true,
        weeklyDigest: preferences.notifications?.weeklyDigest ?? false,
        monthlyReport: preferences.notifications?.monthlyReport ?? true,
        accountConnection: preferences.notifications?.accountConnection ?? true,
      },
      general: {
        emailNotifications: preferences.general?.emailNotifications ?? true,
        budgetAlerts: preferences.general?.budgetAlerts ?? true,
        weeklyReports: preferences.general?.weeklyReports ?? false,
        monthlyReports: preferences.general?.monthlyReports ?? true,
        currency: preferences.general?.currency || 'USD',
        timezone: preferences.general?.timezone || 'America/New_York',
        theme: preferences.general?.theme || 'light',
      },
      monthlyBudget: user.monthlyBudget ? parseFloat(user.monthlyBudget.toString()) : null,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SettingsData = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, preferences: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge existing preferences with new data
    const existingPreferences = user.preferences as any || {};
    const updatedPreferences: Prisma.InputJsonValue = {
      ...existingPreferences,
      ...(body.notifications && { notifications: body.notifications }),
      ...(body.general && { general: body.general }),
      ...(body.profile?.timezone && { timezone: body.profile.timezone }),
    };

    // Update user preferences and name if provided
    const updateData: any = {
      preferences: updatedPreferences,
    };

    if (body.profile?.name) {
      updateData.name = body.profile.name;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}