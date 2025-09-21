// lib/auth.ts - NextAuth configuration with 2FA support
import { DefaultSession, NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { checkDeviceTrust, trustDevice } from "./device-trust"
import { getUserTwoFactorStatus } from "./two-factor"
import { sendSecurityAlert } from "./email-2fa"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      twoFactorEnabled?: boolean;
      requiresTwoFactor?: boolean;
      deviceTrusted?: boolean;
    } & DefaultSession["user"];
  }

  interface JWT {
    id: string;
    twoFactorVerified?: boolean;
    twoFactorVerifiedAt?: number;
    deviceFingerprint?: string;
    requiresTwoFactor?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        // For now, we'll add password field later if needed
        // This is just for Google OAuth primarily
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session: updateData }) {
      // Initial sign in
      if (user && account) {
        token.id = user.id
        token.twoFactorVerified = false // Always start as unverified

        // Check if user has 2FA enabled
        try {
          const twoFactorStatus = await getUserTwoFactorStatus(user.id)
          token.requiresTwoFactor = twoFactorStatus.enabled

          // Send security alert for new sign-in
          if (user.email) {
            await sendSecurityAlert(user.email, 'login', {
              timestamp: new Date(),
            })
          }
        } catch (error) {
          console.error('Error checking 2FA status:', error)
          token.requiresTwoFactor = false
        }
      }

      // On subsequent requests, ensure we have user ID
      if (!token.id && user?.id) {
        token.id = user.id
      }

      // Update session trigger (for 2FA verification)
      if (trigger === 'update' && updateData) {
        if (updateData.twoFactorVerified) {
          token.twoFactorVerified = true
          // Set expiry for 2FA verification (24 hours)
          token.twoFactorVerifiedAt = Date.now()
        }
        if (updateData.deviceFingerprint) {
          token.deviceFingerprint = updateData.deviceFingerprint
        }
        if (updateData.requiresTwoFactor !== undefined) {
          token.requiresTwoFactor = updateData.requiresTwoFactor
        }
      }

      // Check if 2FA verification has expired (24 hours)
      if (token.twoFactorVerified && token.twoFactorVerifiedAt) {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000)
        if (token.twoFactorVerifiedAt < twentyFourHoursAgo) {
          token.twoFactorVerified = false
          token.twoFactorVerifiedAt = null
        }
      }

      return token
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.requiresTwoFactor = token.requiresTwoFactor && !token.twoFactorVerified
        session.user.deviceTrusted = !token.requiresTwoFactor || token.twoFactorVerified

        // Get current 2FA status
        try {
          const twoFactorStatus = await getUserTwoFactorStatus(token.id)
          session.user.twoFactorEnabled = twoFactorStatus.enabled
        } catch (error) {
          console.error('Error getting 2FA status for session:', error)
          session.user.twoFactorEnabled = false
        }
      }
      return session
    },

    async signIn({ user, account, profile }) {
      // Allow sign-in, 2FA will be handled in middleware/pages
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    // signUp: '/auth/signup', // Custom if needed
  }
}

// Export for use in API routes
export default authOptions