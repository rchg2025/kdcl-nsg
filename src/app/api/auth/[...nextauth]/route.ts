import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"

const handler = async (req: any, res: any) => {
  const [googleClientId, googleClientSecret] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "GOOGLE_CLIENT_ID" } }),
    prisma.systemSetting.findUnique({ where: { key: "GOOGLE_CLIENT_SECRET" } })
  ])

  const providers = [...authOptions.providers]

  if (googleClientId?.value && googleClientSecret?.value) {
    providers.push(
      GoogleProvider({
        clientId: googleClientId.value,
        clientSecret: googleClientSecret.value
      })
    )
  }

  return NextAuth(req, res, {
    ...authOptions,
    providers
  })
}

export { handler as GET, handler as POST }
