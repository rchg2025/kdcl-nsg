import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@localhost.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) return null
        
        if (user.isActive === false) {
           throw new Error("Tài khoản của bạn đã bị vô hiệu hóa")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar
        } as any
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string }
        })
        if (!existingUser) {
          return "/login?error=not-linked"
        }
        if (existingUser.isActive === false) {
           return "/login?error=disabled"
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session, account }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } })
        if (dbUser) {
          token.role = dbUser.role
          token.id = dbUser.id
          token.avatar = dbUser.avatar
        }
      } else if (user) {
        token.role = (user as any).role
        token.id = user.id
        token.avatar = (user as any).avatar
      }
      if (trigger === "update" && session?.avatar !== undefined) {
        token.avatar = session.avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role as string
        (session.user as any).id = token.id as string
        (session.user as any).avatar = token.avatar as string | undefined
      }
      return session
    }
  },
  events: {
    async signIn({ user, account }) {
      let userId = user?.id;
      let userEmail = user?.email;
      
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email as string } })
        if (dbUser) {
          userId = dbUser.id;
        }
      }

      if (userId) {
        // dynamic import to avoid circular dependency issues at boot time
        const { createSystemLog } = await import('@/actions/log');
        await createSystemLog(userId, "LOGIN", "Hệ thống (System)", `Người dùng bắt đầu phiên làm việc: ${userEmail}`);
      }
    },
    async signOut({ token }) {
      if (token?.id) {
        const { createSystemLog } = await import('@/actions/log');
        await createSystemLog(token.id as string, "LOGOUT", "Hệ thống (System)", `Người dùng kết thúc phiên làm việc: ${token.email}`);
      }
    }
  },
  pages: {
    signIn: '/login'
  }
}
