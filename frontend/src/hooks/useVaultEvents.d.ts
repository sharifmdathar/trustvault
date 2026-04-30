interface VaultEvent {
  id: string;
  hash: string;
  timestamp: string;
  type: string;
  details: string;
  ledger: number;
}
interface UseVaultEventsResult {
  liveEvents: VaultEvent[];
  historicalEvents: VaultEvent[];
}
export function useVaultEvents(vaultId: string | null | undefined): UseVaultEventsResult;
