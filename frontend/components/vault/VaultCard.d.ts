import { FC } from "react";
import { Vault } from "../../types";
interface VaultCardProps {
  vault: Vault;
  role?: string;
  onConfirm?: (vaultId: string) => void | Promise<void>;
  onDispute?: (vaultId: string) => void | Promise<void>;
}
declare const VaultCard: FC<VaultCardProps>;
export default VaultCard;
