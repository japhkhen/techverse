export type MoolreResult = {
  status?: number | string;
  code?: string;
  message?: string | null;
  data?: unknown;
  authorization_url?: string;
  reference?: string;
  txstatus?: number;
  transactionid?: string;
  externalref?: string;
};

export function moolreConfigured() {
  return Boolean(
    process.env.MOOLRE_API_USER &&
      process.env.MOOLRE_API_PUBKEY &&
      process.env.MOOLRE_ACCOUNT_NUMBER,
  );
}

function headers() {
  return {
    "Content-Type": "application/json",
    "X-API-USER": process.env.MOOLRE_API_USER ?? "",
    "X-API-PUBKEY": process.env.MOOLRE_API_PUBKEY ?? "",
  };
}

async function postMoolre(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    cache: "no-store",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as MoolreResult;
  if (!response.ok && !payload.code) {
    throw new Error(payload.message || "Moolre could not start this payment.");
  }
  return payload;
}

export async function collectMobileMoney(input: {
  channel: "13" | "6" | "7";
  payer: string;
  amount: string;
  externalRef: string;
  otp?: string;
}) {
  return postMoolre("https://api.moolre.com/open/transact/payment", {
    type: 1,
    channel: input.channel,
    currency: "GHS",
    payer: input.payer,
    amount: input.amount,
    externalref: input.externalRef,
    accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    ...(input.otp ? { otpcode: input.otp } : {}),
  });
}

export async function createPaymentLink(input: {
  amount: string;
  email: string;
  externalRef: string;
  callbackUrl: string;
  redirectUrl: string;
}) {
  return postMoolre("https://api.moolre.com/embed/link", {
    type: 1,
    amount: input.amount,
    currency: "GHS",
    email: input.email,
    externalref: input.externalRef,
    reusable: "0",
    accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
    callback: input.callbackUrl,
    redirect: input.redirectUrl,
  });
}

export async function checkPaymentStatus(externalRef: string) {
  return postMoolre("https://api.moolre.com/open/transact/status", {
    type: 1,
    idtype: "1",
    id: externalRef,
    accountnumber: process.env.MOOLRE_ACCOUNT_NUMBER,
  });
}

export function readTxStatus(payload: MoolreResult) {
  const nested = payload.data && typeof payload.data === "object" ? (payload.data as { txstatus?: number | string; transactionid?: string }).txstatus : undefined;
  const value = payload.txstatus ?? nested;
  return value == null ? null : Number(value);
}

export function readTransactionId(payload: MoolreResult) {
  if (payload.transactionid) return String(payload.transactionid);
  if (payload.data && typeof payload.data === "object" && "transactionid" in payload.data) {
    const id = (payload.data as { transactionid?: string | null }).transactionid;
    return id ? String(id) : null;
  }
  return null;
}

export function paymentMessage(payload: MoolreResult) {
  if (payload.code === "TP14") return "Enter the verification code Moolre sent to your phone.";
  if (payload.code === "TR099") return "Approve the prompt on your phone to complete payment.";
  if (payload.code === "TP13") return "This payment reference was already used. Start checkout again.";
  return payload.message || "Payment could not be started.";
}
