/**
 * src/lib/corporate/whitelist.ts
 *
 * The list of company email domains allowed to sign in to corporate.nexplan.io.
 * This is the SOLE source of truth for "who is corporate".
 *
 * Add a new client → add their domain here → push.
 *
 * For a richer admin-controlled experience later, move this to a Supabase
 * table called `corporate_workspaces` with columns:
 *   id, domain, company_name, plan, seats, renewal_at, licence_id, active
 */

export interface CorporateWorkspace {
  /** Email domain — used to match sign-in attempts */
  domain:        string;
  /** Display name shown in the portal */
  company_name:  string;
  /** Plan tier */
  plan:          'enterprise' | 'business' | 'datacenter';
  /** Total licensed seats */
  seats:         number;
  /** Seats currently in use (for mock; real version reads from Supabase) */
  seats_in_use:  number;
  /** Licence renewal date — ISO yyyy-mm-dd */
  renewal_at:    string;
  /** Linked licence_id from issued_licences table */
  licence_id:    string;
  /** Whether the workspace is currently active */
  active:        boolean;
}

export const CORPORATE_WORKSPACES: CorporateWorkspace[] = [
  {
    domain:       'nexplan.io',
    company_name: 'Nexplan',
    plan:         'enterprise',
    seats:        25,
    seats_in_use: 18,
    renewal_at:   '2027-01-28',
    licence_id:   'lic_internal_demo',
    active:       true,
  },
  {
    domain:       'acme.com',
    company_name: 'Acme Corp',
    plan:         'enterprise',
    seats:        25,
    seats_in_use: 18,
    renewal_at:   '2027-01-28',
    licence_id:   'lic_acme_demo',
    active:       true,
  },
  // Add a real client once they buy:
  // {
  //   domain:       'citibank.com',
  //   company_name: 'Citibank',
  //   plan:         'datacenter',
  //   seats:        500,
  //   seats_in_use: 0,
  //   renewal_at:   '2027-04-15',
  //   licence_id:   'lic_xxxxxxxx',
  //   active:       true,
  // },
]

/** Look up a workspace by email — returns null if domain isn't whitelisted */
export function findWorkspaceByEmail(email: string | null | undefined): CorporateWorkspace | null {
  if (!email) return null
  const domain = email.split('@')[1]?.toLowerCase().trim()
  if (!domain) return null
  return CORPORATE_WORKSPACES.find(w => w.domain === domain && w.active) ?? null
}

/** Check if an email belongs to a whitelisted corporate domain */
export function isCorporateEmail(email: string | null | undefined): boolean {
  return findWorkspaceByEmail(email) !== null
}
