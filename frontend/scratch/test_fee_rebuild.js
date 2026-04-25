import * as StellarSdk from "@stellar/stellar-sdk";
const { rpc, TransactionBuilder, BASE_FEE, Networks, Account, Transaction, xdr } = StellarSdk;

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const sourceAccount = new Account("GDFGTDYIP5YH2P2HHNTEN6KRI3WSKXDBUQSZWOCUHHJMB7Z3FO2LIUOI", "1");
const contractId = "CCFPVPGDYKSDNQLDYFQLHKLJR4KB36KU2CD3G6N5UOPAXX7BPBMSZ6BN";
const contract = new StellarSdk.Contract(contractId);

const tx = new TransactionBuilder(sourceAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
  .addOperation(contract.call("get_vault_count"))
  .setTimeout(30)
  .build();

try {
  const sim = await server.simulateTransaction(tx);
  console.log("minResourceFee:", sim.minResourceFee);
  
  // Assemble normally 
  const assembled = rpc.assembleTransaction(tx, sim).build();
  console.log("Assembled fee:", assembled.fee);
  
  // Get the soroban data from the assembled transaction
  const sorobanData = assembled.toEnvelope().v1().tx().ext().sorobanData();
  console.log("SorobanData resourceFee:", sorobanData.resourceFee().toString());
  
  // Strategy: rebuild the transaction from scratch with minimal fee but same soroban data
  const rebuiltTx = new TransactionBuilder(sourceAccount, { 
    fee: BASE_FEE, 
    networkPassphrase: Networks.TESTNET 
  })
    .addOperation(assembled.operations[0])
    .setSorobanData(sorobanData)
    .setTimeout(30)
    .build();
  
  console.log("Rebuilt tx fee:", rebuiltTx.fee);

  // Strategy 2: directly modify the XDR fee
  const envelope = assembled.toEnvelope();
  const txBody = envelope.v1().tx();
  console.log("XDR fee before hack:", txBody.fee().toString());
  
  // Can we modify fee in XDR directly?
  txBody.fee(new StellarSdk.xdr.Uint32(100));
  console.log("XDR fee after hack:", txBody.fee().toString());
  
  // Rebuild from modified XDR
  const hackedTx = new Transaction(envelope.toXDR("base64"), Networks.TESTNET);
  console.log("Hacked tx fee:", hackedTx.fee);
  
} catch(e) {
  console.log("Error:", e.message);
  console.log("Stack:", e.stack);
}
