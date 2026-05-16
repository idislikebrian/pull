import { PrivyClient, type LinkedAccount, type User as PrivyUser } from "@privy-io/node";
import { authIsConfigured } from "@/lib/auth-config";
import { generateSignalerHandle } from "@/lib/handles";
import { prisma } from "@/lib/prisma";

type IdentityAccountInput = {
  provider: "PRIVY_PHONE" | "PRIVY_EMAIL" | "PRIVY_WALLET" | "PRIVY_PASSKEY" | "PRIVY_SOCIAL";
  providerAccountId: string;
  normalizedValue?: string;
  displayValue?: string;
  verifiedAt?: Date;
};

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

let privyClient: PrivyClient | null = null;

function getPrivyClient() {
  if (!authIsConfigured()) {
    throw new AuthError("Authentication is not configured.", 500);
  }

  if (!privyClient) {
    privyClient = new PrivyClient({
      appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
      appSecret: process.env.PRIVY_APP_SECRET!
    });
  }

  return privyClient;
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function dateFromUnix(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : undefined;
}

function lastFour(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `...${digits.slice(-4)}` : undefined;
}

function accountInput(account: LinkedAccount): IdentityAccountInput | null {
  if (account.type === "phone") {
    const value = account.phoneNumber || account.number;

    if (!value) {
      return null;
    }

    return {
      provider: "PRIVY_PHONE",
      providerAccountId: value,
      normalizedValue: value,
      displayValue: lastFour(value),
      verifiedAt: dateFromUnix(account.latest_verified_at ?? account.verified_at)
    };
  }

  if (account.type === "email") {
    const value = account.address.toLowerCase();

    return {
      provider: "PRIVY_EMAIL",
      providerAccountId: value,
      normalizedValue: value,
      displayValue: value,
      verifiedAt: dateFromUnix(account.latest_verified_at ?? account.verified_at)
    };
  }

  if (account.type === "wallet" || account.type === "smart_wallet") {
    const value = account.address.toLowerCase();
    const chain = "chain_type" in account && account.chain_type ? account.chain_type : "wallet";

    return {
      provider: "PRIVY_WALLET",
      providerAccountId: `${chain}:${value}`,
      normalizedValue: value,
      displayValue: `${value.slice(0, 6)}...${value.slice(-4)}`,
      verifiedAt: dateFromUnix(account.latest_verified_at ?? account.verified_at)
    };
  }

  if (account.type === "passkey") {
    return {
      provider: "PRIVY_PASSKEY",
      providerAccountId: account.credential_id,
      displayValue: account.authenticator_name,
      verifiedAt: dateFromUnix(account.latest_verified_at ?? account.verified_at)
    };
  }

  if ("subject" in account && typeof account.subject === "string") {
    const socialAccount = account as LinkedAccount & {
      email?: string | null;
      latest_verified_at?: number | null;
      username?: string | null;
      verified_at?: number | null;
    };
    const email = "email" in account && typeof account.email === "string" ? account.email.toLowerCase() : undefined;

    return {
      provider: "PRIVY_SOCIAL",
      providerAccountId: `${account.type}:${account.subject}`,
      normalizedValue: email,
      displayValue: email ?? (typeof socialAccount.username === "string" ? socialAccount.username : account.type),
      verifiedAt: dateFromUnix(socialAccount.latest_verified_at ?? socialAccount.verified_at)
    };
  }

  return null;
}

function primaryEmail(privyUser: PrivyUser) {
  const emailAccount = privyUser.linked_accounts.find((account) => account.type === "email");
  return emailAccount?.type === "email" ? emailAccount.address.toLowerCase() : null;
}

async function availableEmail(email: string | null, userId?: string) {
  if (!email) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (!existing || existing.id === userId) {
    return email;
  }

  return null;
}

async function syncIdentityAccounts(userId: string, privyUser: PrivyUser) {
  const accounts = privyUser.linked_accounts.map(accountInput).filter((account): account is IdentityAccountInput => Boolean(account));

  await Promise.all(
    accounts.map((account) =>
      prisma.identityAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId
          }
        },
        update: {
          userId,
          normalizedValue: account.normalizedValue,
          displayValue: account.displayValue,
          verifiedAt: account.verifiedAt
        },
        create: {
          userId,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          normalizedValue: account.normalizedValue,
          displayValue: account.displayValue,
          verifiedAt: account.verifiedAt
        }
      })
    )
  );
}

export async function requireCurrentUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    throw new AuthError("Authentication required.");
  }

  const client = getPrivyClient();
  const verified = await client.utils().auth().verifyAccessToken(token);
  const privyUser = await client.users()._get(verified.user_id);
  const email = primaryEmail(privyUser);

  let user = await prisma.user.findUnique({
    where: { privyUserId: verified.user_id }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        privyUserId: verified.user_id,
        handle: await generateSignalerHandle(),
        email: await availableEmail(email),
        lastLoginAt: new Date()
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: (await availableEmail(email, user.id)) ?? user.email,
        lastLoginAt: new Date()
      }
    });
  }

  if (user.status === "SUSPENDED") {
    throw new AuthError("This account cannot participate right now.", 403);
  }

  await syncIdentityAccounts(user.id, privyUser);

  return user;
}
