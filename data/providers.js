export const PROVIDERS = [
  "netflix",
  "zoom",
  "chatgpt",
  "amazon-prime-video",
  "freepik",
  "scribd",
];

export const getProviderSubjects = (provider) => {
  switch (provider) {
    case "netflix":
      return [
        "Netflix: Kode masukmu",
        "Netflix: your sign-in code",
        // "Kode akses sementara Netflix-mu", // Perlu di cari tahu lagi tentang ini
      ];

    case "zoom":
      return ["Code for signing in to Zoom"];

    case "chatgpt":
      return ["Your temporary ChatGPT login code"];

    case "capcut":
      return [/^\d{4,6} is your verification code$/i];

    case "scribd":
      return [/^Your one-time passcode for Scribd is \d{4,6}$/i];

    case "freepik":
      return ["Your authentication code"];

    default:
      return [];
  }
};
