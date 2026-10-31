export function toMoolreLocal(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("233")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

export function toE164Ghana(phone: string) {
  const local = toMoolreLocal(phone);
  return `+233${local.slice(1)}`;
}

export function isGhanaMobile(phone: string) {
  return /^0[235]\d{8}$/.test(toMoolreLocal(phone));
}
