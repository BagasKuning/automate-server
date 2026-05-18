const ACCOUNTS = new Set([
  "amrinahafidza@gmail.com", // netflix
  "tulipbellex@gmail.com", // zoom
  "sofiaivy275@gmail.com", // chatgpt
  "mykisahgwejh@gmail.com", // amazon-prime-video
  "apaituwhatitis@gmail.com", // scribd
  "dory10@seakun.xyz", // freepik

  "seakunid3@outlook.com", // chatgpt
  "monocromvibes@gmail.com", // freepik

  "viona3047@gmail.com", // chatgpt
  "wiri7110@gmail.com",
  "mmie64812@gmail.com",
  "mnasi2528@gmail.com",
  "dwibagaskara66@gmail.com",
]);

function validateAccount(account) {
  return ACCOUNTS.has(account.toLowerCase().trim());
}

export { ACCOUNTS, validateAccount };
