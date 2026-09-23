/** "acme/pr-evidence#42" <-> /pull-requests/acme/pr-evidence/42 */
export function prIdFromParams(p: { owner: string; repo: string; number: string }): string {
  return `${p.owner}/${p.repo}#${p.number}`;
}

export function prPath(repo: string, number: number): string {
  return `/pull-requests/${repo}/${number}`;
}
