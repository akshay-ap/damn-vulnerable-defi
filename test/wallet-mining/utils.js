const execTransaction = async function (
  wallets,
  safe,
  to,
  value,
  data,
  operation
) {
  const ADDRESS_0 = "0x0000000000000000000000000000000000000000";
  let nonce = await safe.nonce();

  let transactionHash = await safe.getTransactionHash(
    to,
    value,
    data,
    operation,
    0,
    0,
    0,
    ADDRESS_0,
    ADDRESS_0,
    nonce
  );
  let signatureBytes = "0x";
  let bytesDataHash = ethers.utils.arrayify(transactionHash);

  const sorted = Array.from(wallets).sort((a, b) => {
    return a.address.localeCompare(b.address, "en", { sensitivity: "base" });
  });

  for (let i = 0; i < sorted.length; i++) {
    let flatSig = (await sorted[i].signMessage(bytesDataHash))
      .replace(/1b$/, "1f")
      .replace(/1c$/, "20");
    signatureBytes += flatSig.slice(2);
  }

  await safe
    .connect(wallets[0])
    .execTransaction(
      to,
      value,
      data,
      operation,
      0,
      0,
      0,
      ADDRESS_0,
      ADDRESS_0,
      signatureBytes
    );
};

module.exports = {
  execTransaction,
};
