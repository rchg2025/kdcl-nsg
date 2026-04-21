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
          role: user.role
        }
      }
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        // dynamic import to avoid circular dependency issues at boot time
        const { createSystemLog } = await import('@/actions/log');
        await createSystemLog(user.id, "LOGIN", "Hệ thống (System)", `Người dùng bắt đầu phiên làm việc: ${user.email}`);
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
