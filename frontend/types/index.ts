export interface Vault {
  id: string;
  buyer: string;
  seller: string;
  arbitrator: string;
  amount: string;
  description: string;
  status:
    | "pending"
    | "funded"
    | "confirmed"
    | "disputed"
    | "resolved"
    | "cancelled"
    | "expired";
  createdAt: string;
  deadline: string;
  buyerConfirmed?: boolean;
  sellerConfirmed?: boolean;
  confirmedAt?: string;
  resolvedAt?: string;
  decision?: "buyer" | "seller" | "split";
}

export interface Transaction {
  id: string;
  type: "create" | "deposit" | "confirm" | "dispute" | "resolve";
  vaultId: string;
  from: string;
  to?: string;
  amount?: string;
  /** Arbitration decision recorded for resolve-type transactions. */
  decision?: string;
  timestamp: string;
  status: "pending" | "success" | "failed";
}

export interface ArbitrationCase {
  vaultId: string;
  /** The arbitrator who submitted the resolution on-chain. */
  arbitrator: string;
  decision: "buyer" | "seller" | "split" | null;
  reason: string;
  timestamp: string;
  resolved: boolean;
}
