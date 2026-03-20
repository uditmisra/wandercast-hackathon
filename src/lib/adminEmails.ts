export const ADMIN_EMAILS: ReadonlyArray<string> = [
  'udit.misra93@gmail.com',
];

export function isAdmin(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
