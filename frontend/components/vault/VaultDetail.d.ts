import { FC } from "react";
import { Vault } from "../../types";
interface VaultDetailProps {
  vault: Vault | null;
  address?: string;
  onDeposit?: (...args: unknown[]) => unknown;
  onConfirm?: (...args: unknown[]) => unknown;
  onDispute?: (...args: unknown[]) => unknown;
  onResolve?: (...args: unknown[]) => unknown;
  [key: string]: unknown;
}
declare const VaultDetail: FC<VaultDetailProps>;
export default VaultDetail;
