export const authConfig = {
    pages: {
        signIn: "/auth",
    },
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id
            }
            return session
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isAuthPage = nextUrl.pathname.startsWith('/auth')
            const isPublicAsset = nextUrl.pathname.includes('.') || nextUrl.pathname.startsWith('/api/auth')

            if (isPublicAsset) return true

            if (isAuthPage) {
                if (isLoggedIn) return Response.redirect(new URL('/', nextUrl))
                return true
            }

            return isLoggedIn
        },
    },
    providers: [], // Providers will be added in auth.js
}
