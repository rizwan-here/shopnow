import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Facebook from 'next-auth/providers/facebook';

const providers = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      authorization: {
        params: {
          scope: 'public_profile'
        }
      }
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt'
  },
  providers,
  callbacks: {
    async jwt({ token, account, profile, user, trigger, session }) {
      if (account?.provider) {
        token.provider = account.provider;
        token.userId = `${account.provider}:${account.providerAccountId}`;
      }
      if (user?.id && !token.userId) {
        token.userId = user.id;
      }
      if (token.sub && !token.userId) {
        token.userId = token.sub;
      }
      if (profile?.email && !token.email) {
        token.email = profile.email;
      }
      if (trigger === 'update' && session?.user?.username) {
        token.username = session.user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        session.user = {};
      }
      if (token?.provider) {
        session.user.provider = token.provider;
      }
      if (token?.userId) {
        session.user.id = token.userId;
      }
      if (token?.sub && !session.user.id) {
        session.user.id = token.sub;
      }
      if (token?.username) {
        session.user.username = token.username;
      }
      return session;
    }
  },
  pages: {
    signIn: '/'
  }
});
