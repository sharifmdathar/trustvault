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
  timestamp: string;
  status: "pending" | "success" | "failed";
}

export interface ArbitrationCase {
  vaultId: string;
  arbitrators: string[];
  votesBuyer: number;
  votesSeller: number;
  votesSplit: number;
  totalVotes: number;
  resolved: boolean;
  decision: "buyer" | "seller" | "split" | null;
}
